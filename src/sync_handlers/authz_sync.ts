import { BlockCore } from "../postgres/blocksync_core/block";
import { decodeMessage } from "../util/proto";
import {
  decodeAuthorization,
  extractGranterFromInnerMsg,
  msgTypeUrlForAuthorization,
  timestampToDate,
  toBytes,
  DecodedAuthorization,
} from "../util/authz";
import { authzGrantsQuery } from "../util/archive-queries";
import { getEntityAccountAddress } from "../postgres/entity";
import { getClaimAgentAddress } from "../postgres/claim";
import {
  closeAuthzGrant,
  getActiveGrantKeys,
  insertClosedAuthzGrant,
  upsertActiveAuthzGrant,
  AuthzGrantStatus,
} from "../postgres/authz";

// Indexes x/authz grants into the authz_grant current-state table.
//
// Two phases per block:
//   1. Scan successful txs for grant-touching messages and collect the set of
//      (granter, grantee) pairs they touch, with per-pair create/revoke intent.
//   2. For each touched pair, hydrate the authoritative post-block grant state
//      from the archive LCD at this height and reconcile the table: live
//      grants upsert to active; previously-active rows missing from the LCD
//      close as revoked/expired/exhausted; grants created and consumed within
//      this same block are recorded directly in their closed state.
//
// Hydration is required for accuracy: constraints mutate on-chain without any
// message carrying the new state (SendAuthorization spend-limit decrements,
// ixo claims quota consumption, MsgCreateClaimAuthorization constraint
// merging, exhausted-grant auto-deletion).
//
// Errors are deliberately NOT swallowed — like event_data_sync (and unlike
// transaction_sync's insert catch), any failure must roll back the per-block
// transaction so the block retries.
//
// KNOWN LIMITATION: authz activity that never surfaces as a top-level or
// MsgExec-wrapped message is invisible to this scan — e.g. a CosmWasm
// contract (DAO DAO proposal execution) dispatching MsgGrant/MsgRevoke/
// MsgExec as a stargate submessage, ICA host execution, or gov-authority
// execution in EndBlock. Closing that gap requires blocksync-core to start
// persisting cosmos.authz.v1beta1.EventGrant/EventRevoke typed events (they
// are currently filtered out by core's EventTypes allowlist); grants touched
// through those paths are corrected whenever the pair is next touched by a
// visible message.

type GrantCreate = {
  creatingMessageType: string;
  txHash: string;
  entityId?: string;
  // present when the create's authorization was decodable from the message —
  // used for the created-and-closed-within-one-block edge case
  decodedAuth?: DecodedAuthorization;
  expiration?: Date;
  // for WILDCARD creates only: the authorization @types this message can
  // actually produce, so the wildcard doesn't claim (and reset provenance on)
  // unrelated live grants of the same pair
  authTypes?: string[];
};

type TouchedPair = {
  granter: string;
  grantee: string;
  txHash: string;
  // keyed by grant msgTypeUrl, or "*" when the resulting keys are only
  // knowable via hydration (MsgCreateClaimAuthorization merges on-chain)
  creates: Map<string, GrantCreate>;
  revokes: Set<string>;
};

const WILDCARD = "*";

export const syncAuthz = async (block: BlockCore) => {
  if (block.transactions.length === 0) return;

  const pairs = new Map<string, TouchedPair>();

  const addPair = (granter: string, grantee: string, txHash: string): TouchedPair => {
    const key = `${granter}|${grantee}`;
    let pair = pairs.get(key);
    if (!pair) {
      pair = { granter, grantee, txHash, creates: new Map(), revokes: new Set() };
      pairs.set(key, pair);
    }
    pair.txHash = txHash;
    return pair;
  };

  const grantExpiration = (grant: any): Date | undefined =>
    timestampToDate(grant?.expiration);

  // Registers the (granter, grantee) pairs a message touches. Recursive:
  // MsgExec inner messages can themselves be any of the trigger types.
  const collectTriggers = async (
    typeUrl: string,
    value: any,
    txHash: string
  ): Promise<void> => {
    if (!value) return;
    switch (typeUrl) {
      case "/cosmos.authz.v1beta1.MsgGrant": {
        if (!value.grant?.authorization?.typeUrl) return;
        const auth = decodeAuthorization(value.grant.authorization);
        const key = msgTypeUrlForAuthorization(auth.type, auth.value) ?? WILDCARD;
        addPair(value.granter, value.grantee, txHash).creates.set(key, {
          creatingMessageType: typeUrl,
          txHash,
          decodedAuth: auth,
          expiration: grantExpiration(value.grant),
          ...(key === WILDCARD ? { authTypes: [auth.type] } : {}),
        });
        return;
      }
      case "/cosmos.authz.v1beta1.MsgRevoke": {
        addPair(value.granter, value.grantee, txHash).revokes.add(value.msgTypeUrl);
        return;
      }
      case "/ixo.entity.v1beta1.MsgGrantEntityAccountAuthz": {
        const granter = await getEntityAccountAddress(value.id, value.name);
        if (!granter)
          throw new Error(
            `authz_sync: no entity account "${value.name}" on entity ${value.id} (tx ${txHash})`
          );
        if (!value.grant?.authorization?.typeUrl) return;
        const auth = decodeAuthorization(value.grant.authorization);
        const key = msgTypeUrlForAuthorization(auth.type, auth.value) ?? WILDCARD;
        addPair(granter, value.granteeAddress, txHash).creates.set(key, {
          creatingMessageType: typeUrl,
          txHash,
          entityId: value.id,
          decodedAuth: auth,
          expiration: grantExpiration(value.grant),
          ...(key === WILDCARD ? { authTypes: [auth.type] } : {}),
        });
        return;
      }
      case "/ixo.entity.v1beta1.MsgRevokeEntityAccountAuthz": {
        const granter = await getEntityAccountAddress(value.id, value.name);
        if (!granter)
          throw new Error(
            `authz_sync: no entity account "${value.name}" on entity ${value.id} (tx ${txHash})`
          );
        addPair(granter, value.granteeAddress, txHash).revokes.add(value.msgTypeUrl);
        return;
      }
      case "/ixo.claims.v1beta1.MsgCreateClaimAuthorization": {
        // Creates/merges Submit-/EvaluateClaimAuthorization grants on-chain
        // without a MsgGrant; the resulting grant keys and merged constraints
        // are only knowable via hydration.
        addPair(value.adminAddress, value.granteeAddress, txHash).creates.set(WILDCARD, {
          creatingMessageType: typeUrl,
          txHash,
          authTypes: [
            "/ixo.claims.v1beta1.SubmitClaimAuthorization",
            "/ixo.claims.v1beta1.EvaluateClaimAuthorization",
          ],
        });
        return;
      }
      case "/ixo.claims.v1beta1.MsgSubmitClaim": {
        // The claims module's processPayment auto-creates a
        // WithdrawPaymentAuthorization grant (admin -> claim agent) for any
        // delayed SUBMISSION payout — no MsgGrant appears in the stream.
        addPair(value.adminAddress, value.agentAddress, txHash).creates.set(WILDCARD, {
          creatingMessageType: typeUrl,
          txHash,
          authTypes: ["/ixo.claims.v1beta1.WithdrawPaymentAuthorization"],
        });
        return;
      }
      case "/ixo.claims.v1beta1.MsgEvaluateClaim": {
        // Same for delayed APPROVAL payouts — but the auto-grant's grantee is
        // the claim SUBMITTER, who is not in this message; resolve them from
        // the Claim table (written by event sync earlier in this block's txn).
        const claimAgent = await getClaimAgentAddress(value.claimId);
        if (!claimAgent) {
          // Soft gap, not a stall: the grant will be picked up when the
          // agent execs MsgWithdrawPayment against it.
          console.warn(
            `authz_sync: claim ${value.claimId} not found for evaluation in tx ${txHash}`
          );
          return;
        }
        addPair(value.adminAddress, claimAgent, txHash).creates.set(WILDCARD, {
          creatingMessageType: typeUrl,
          txHash,
          authTypes: ["/ixo.claims.v1beta1.WithdrawPaymentAuthorization"],
        });
        return;
      }
      case "/cosmos.authz.v1beta1.MsgExec": {
        for (const inner of value.msgs ?? []) {
          if (!inner?.typeUrl) continue;
          const decoded = decodeMessage({
            typeUrl: inner.typeUrl,
            value: toBytes(inner.value),
          });
          if (!decoded) {
            // Unknown inner type: we can't attribute a granter, so skip this
            // inner msg rather than failing the block. The grant's state will
            // be corrected the next time the pair is touched.
            console.warn(
              `authz_sync: undecodable MsgExec inner msg ${inner.typeUrl} in tx ${txHash}`
            );
            continue;
          }
          // Executing consumes/mutates the (innerSigner, grantee, innerTypeUrl)
          // grant — mark the pair for hydration.
          const granter = extractGranterFromInnerMsg(decoded);
          if (granter) addPair(granter, value.grantee, txHash);
          // The inner msg may itself be a grant-touching message
          // (exec'd MsgGrant/MsgRevoke/nested MsgExec/...).
          await collectTriggers(inner.typeUrl, decoded, txHash);
        }
        return;
      }
    }
  };

  // ---- Phase 1: scan ----
  for (const tx of block.transactions) {
    if (tx.code !== 0) continue; // failed txs are present in core data
    for (const m of tx.messages) {
      await collectTriggers(m.typeUrl, m.value, tx.hash);
    }
  }
  if (pairs.size === 0) return;

  // ---- Phase 2: hydrate + reconcile (sequential; touched pairs per block are few) ----
  for (const pair of pairs.values()) {
    const live = await authzGrantsQuery(block.height, pair.granter, pair.grantee);

    const liveByKey = new Map<string, (typeof live)[number]>();
    for (const g of live) {
      const atType = g.authorization["@type"];
      let key = msgTypeUrlForAuthorization(atType, g.authorization);
      if (!key) {
        key = `unknown:${atType}`;
        console.warn(`authz_sync: unmapped authorization type ${atType}, keying as ${key}`);
      }
      liveByKey.set(key, g);
    }

    const existing = await getActiveGrantKeys(pair.granter, pair.grantee);
    const existingKeys = new Set(existing.map((e) => e.msgTypeUrl));

    // (a) live grants -> upsert active with authoritative LCD state
    for (const [key, g] of liveByKey) {
      // a WILDCARD create only claims live grants whose authorization type it
      // can actually produce — otherwise e.g. a MsgCreateClaimAuthorization
      // would reset provenance on an unrelated SendAuthorization of the pair
      const wildcard = pair.creates.get(WILDCARD);
      const wildcardApplies =
        !!wildcard &&
        (!wildcard.authTypes || wildcard.authTypes.includes(g.authorization["@type"]));
      const create = pair.creates.get(key) ?? (wildcardApplies ? wildcard : undefined);
      await upsertActiveAuthzGrant(
        {
          granter: pair.granter,
          grantee: pair.grantee,
          msgTypeUrl: key,
          authorizationType: g.authorization["@type"],
          authorization: g.authorization,
          expiration: g.expiration ? new Date(g.expiration) : undefined,
          creatingMessageType: create?.creatingMessageType,
          entityId: create?.entityId,
          height: block.height,
          time: block.time,
          // the creating tx, not just the last tx that touched the pair
          txHash: create?.txHash ?? pair.txHash,
        },
        pair.creates.has(key) || wildcardApplies
      );
    }

    // (b) previously-active rows gone from the LCD -> close
    for (const row of existing) {
      if (liveByKey.has(row.msgTypeUrl)) continue;
      const status: AuthzGrantStatus = pair.revokes.has(row.msgTypeUrl)
        ? "revoked"
        : row.expiration && row.expiration <= block.time
        ? "expired"
        : "exhausted";
      await closeAuthzGrant(
        pair.granter,
        pair.grantee,
        row.msgTypeUrl,
        status,
        block.height,
        block.time,
        pair.txHash
      );
    }

    // (c) created and already gone within this same block -> record closed
    for (const [key, create] of pair.creates) {
      if (key === WILDCARD || liveByKey.has(key) || existingKeys.has(key)) continue;
      if (!create.decodedAuth) continue;
      await insertClosedAuthzGrant(
        {
          granter: pair.granter,
          grantee: pair.grantee,
          msgTypeUrl: key,
          authorizationType: create.decodedAuth.type,
          authorization: create.decodedAuth.value,
          expiration: create.expiration,
          creatingMessageType: create.creatingMessageType,
          entityId: create.entityId,
          height: block.height,
          time: block.time,
          txHash: create.txHash,
        },
        pair.revokes.has(key) ? "revoked" : "exhausted"
      );
    }
  }
};
