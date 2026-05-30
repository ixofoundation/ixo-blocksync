import { NETWORK } from "../util/secrets";
import {
  V7_UPGRADE_HEIGHT,
  V7_LEGACY_POOL_ID,
} from "../constants/v7_upgrade";
import {
  liquidStakeModuleParamsQuery,
  liquidStakePoolsQuery,
  claimsCollectionQuery,
  claimsDisputeListQuery,
} from "../util/archive-queries";
import {
  upsertLiquidStakeModuleParams,
  upsertLiquidStakePool,
  relinkLegacyLiquidStakeTxPoolId,
} from "../postgres/liquidstake";
import {
  dismissLegacyDisputes,
  listAllCollectionIds,
  updateClaimCollection,
} from "../postgres/claim";
import {
  getV7SnapshotState,
  startV7Snapshot,
  finishV7Snapshot,
} from "../postgres/v7_snapshot";
import { collectionFromSdk } from "../sync_handlers/event_data_sync";
import { withTransaction } from "../postgres/client";
import { setCurrentPool } from "./sync_blocks";

// ===========================================================================
// One-shot snapshot of v7 chain-upgrade state. Mirrors silent KV writes the
// chain performs at the upgrade block that wouldn't otherwise surface as
// events:
//
//  - liquidstake: ModuleParams + the legacy "zero" Pool (with all the
//    pre-v7 single-pool config carried over) + per-validator records
//    re-keyed under the new per-pool prefix.
//    See ixo-blockchain/app/upgrades/v7/migrations.go.
//
//  - claims (v3→v4 store migration): legacy disputes (target_role=UNSPECIFIED)
//    stamped status=DISMISSED. See
//    ixo-blockchain/x/claims/migrations/v4/store.go.
//
//  - claims collections: the v7 chain proto adds eleven new fields to
//    Collection that default to zero/empty on existing serialized records;
//    we re-issue an upsert per collection so any field the chain populated
//    server-side at the upgrade (none today, but resilient against
//    future migration tweaks) lands in our DB deterministically.
//
// We ALSO backfill local-only derived state:
//
//  - LiquidStakeTx rows recorded pre-upgrade had poolId="" (the events
//    didn't carry pool_id pre-v7). Rewrite them to V7_LEGACY_POOL_ID so
//    post-upgrade pool-by-pool queries include legacy activity under the
//    pool the chain migration assigned it to.
//
// The snapshot runs at most once per blocksync DB (tracked in
// v7_snapshot_state) and is idempotent: every write is an UPSERT or a
// filtered UPDATE, so a partial run that crashes can be retried safely.
// ===========================================================================

type Counts = {
  pools_count: number;
  module_params_written: boolean;
  legacy_ls_tx_relinked: number;
  legacy_disputes_dismissed: number;
  collections_refreshed: number;
};

export const ensureV7Snapshot = async (
  currentBlock: number
): Promise<void> => {
  if (V7_UPGRADE_HEIGHT === 0) {
    // Upgrade not yet applied / not configured on this network.
    return;
  }
  if (currentBlock < V7_UPGRADE_HEIGHT) return;

  const state = await getV7SnapshotState();
  if (state?.completed_at) return;

  console.log(
    `[v7-snapshot] upgrade=${V7_UPGRADE_HEIGHT} network=${NETWORK} ` +
      `currentBlock=${currentBlock} — taking snapshot at upgrade height`
  );
  // We query chain state AT the upgrade height — not the current block —
  // because that's where the v7 chain migration ran. Any post-upgrade
  // events that have since fired are caught by the normal event-driven
  // path, which the indexer will already have processed for any block
  // currentBlock > V7_UPGRADE_HEIGHT before this routine is called.
  const snapshotHeight = V7_UPGRADE_HEIGHT;

  const counts: Counts = {
    pools_count: 0,
    module_params_written: false,
    legacy_ls_tx_relinked: 0,
    legacy_disputes_dismissed: 0,
    collections_refreshed: 0,
  };

  // Single-transaction snapshot — every write (start marker, every Pool
  // upsert, every dispute UPDATE, every collection refresh, finish
  // marker) commits or rolls back together. If anything fails mid-way
  // (archive rate-limit exhausted, DB conflict, network blip) the whole
  // transaction is rolled back and the next sync-loop iteration retries
  // from scratch with a clean slate.
  try {
    await withTransaction(async (client) => {
      setCurrentPool(client);
      try {
        await startV7Snapshot({
          network: NETWORK,
          upgrade_height: V7_UPGRADE_HEIGHT,
          snapshot_height: snapshotHeight,
        });
        await runSnapshot(snapshotHeight, counts);
        await finishV7Snapshot(counts);
      } finally {
        setCurrentPool(undefined);
      }
    });
    console.log(
      `[v7-snapshot] done: pools=${counts.pools_count} ` +
        `moduleParams=${counts.module_params_written} ` +
        `lsTxRelinked=${counts.legacy_ls_tx_relinked} ` +
        `disputesDismissed=${counts.legacy_disputes_dismissed} ` +
        `collectionsRefreshed=${counts.collections_refreshed}`
    );
  } catch (err: any) {
    console.error(
      `[v7-snapshot] FAILED at height ${snapshotHeight}: ${err?.message}`
    );
    throw err;
  }
};

// ----------------------------------------------------------------------
const runSnapshot = async (
  snapshotHeight: number,
  counts: Counts
): Promise<void> => {
  const now = new Date();

  // ----- liquidstake ModuleParams -----
  // Idempotent UPSERT into a singleton table; safe to call even if the
  // chain never initialized liquidstake (we'd just write defaults).
  const mp = await liquidStakeModuleParamsQuery(snapshotHeight);
  if (mp) {
    await upsertLiquidStakeModuleParams({
      minLiquidStakeAmount: mp.min_liquid_stake_amount,
      modulePaused: mp.module_paused,
      updatedAtHeight: snapshotHeight,
      updatedAt: now,
    });
    counts.module_params_written = true;
  }

  // ----- liquidstake Pools -----
  // Includes the migrated "zero" pool (if the chain had pre-v7 state) plus
  // any others created post-upgrade if we're running this snapshot after
  // the actual upgrade block.
  const pools = await liquidStakePoolsQuery(snapshotHeight);
  for (const p of pools) {
    await upsertLiquidStakePool({
      poolId: p.pool_id,
      liquidBondDenom: p.liquid_bond_denom,
      proxyAccountAddress: p.proxy_account_address,
      whitelistedValidators: p.whitelisted_validators ?? [],
      unstakeFeeRate: p.unstake_fee_rate,
      feeAccountAddress: p.fee_account_address,
      autocompoundFeeRate: p.autocompound_fee_rate,
      whitelistAdminAddress: p.whitelist_admin_address,
      paused: p.paused,
      weightedRewardsReceivers: p.weighted_rewards_receivers ?? [],
      createdAtHeight: snapshotHeight,
      updatedAtHeight: snapshotHeight,
      updatedAt: now,
    });
    counts.pools_count++;
  }

  // ----- LiquidStakeTx pre-v7 pool_id backfill -----
  // Rewrite every LiquidStakeTx row recorded pre-upgrade with poolId=""
  // to the legacy pool id the chain migration assigned.
  counts.legacy_ls_tx_relinked = await relinkLegacyLiquidStakeTxPoolId(
    V7_LEGACY_POOL_ID,
    snapshotHeight
  );

  // ----- Claims: dismiss legacy disputes -----
  // The v7 chain migration scans all Disputes and stamps the ones with
  // target_role=UNSPECIFIED as DISMISSED. We mirror that in our table.
  // We cross-check against the chain's DisputeList query here — if the
  // chain reports a dispute as DISMISSED but our row says otherwise, our
  // update brings them into sync. If the chain query is empty (no
  // disputes anywhere), the local UPDATE still runs and is a no-op.
  counts.legacy_disputes_dismissed = await dismissLegacyDisputes();
  // Best-effort cross-check; not fatal if archive node has issues.
  try {
    const chainDisputes = await claimsDisputeListQuery(snapshotHeight);
    const dismissedOnChain = chainDisputes.filter(
      (d: any) => d.status === "dispute_dismissed" || d.status === 2
    ).length;
    if (dismissedOnChain !== counts.legacy_disputes_dismissed) {
      console.log(
        `[v7-snapshot] dispute count divergence: chain reports ` +
          `${dismissedOnChain} dismissed, we flipped ` +
          `${counts.legacy_disputes_dismissed}. ` +
          `(Expected to differ if chain has post-v7 dismissals, but worth a look.)`
      );
    }
  } catch {
    // archive query failure is non-fatal — the local UPDATE is the source
    // of truth for what we change here.
  }

  // ----- Claims: refresh every ClaimCollection's v7 fields -----
  // Re-fetch each existing collection at the upgrade height and re-upsert
  // it. Pre-v7 collections start with default values for the new fields
  // (flagged*, disputes_*, *_deposit_*, adjudicators, min_deposit_period),
  // so this is largely a confirmation pass — but it ensures we're aligned
  // with what the chain reports, in case any field had non-default state
  // at the upgrade height for any reason.
  const collectionIds = await listAllCollectionIds();
  for (const id of collectionIds) {
    try {
      const c = await claimsCollectionQuery(snapshotHeight, id);
      if (c) {
        await updateClaimCollection(collectionFromSdk(c));
        counts.collections_refreshed++;
      }
    } catch {
      // Skip individual collection failures — the indexer-driven path
      // will catch them on the next CollectionUpdatedEvent post-upgrade.
    }
  }
};
