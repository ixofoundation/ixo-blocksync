import { cosmos, cosmwasm, ibc, ixo } from "@ixo/impactxclient-sdk";
import { decodeMessage } from "./proto";

// Decoding + mapping helpers for x/authz indexing (see sync_handlers/authz_sync.ts).
//
// Authorization payloads reach us as protobuf `Any`s nested inside already-
// decoded messages from the blocksync-core DB, where the raw bytes survive
// JSON round-tripping as a byte-index object ({"0":10,"1":42,...}).

export const toBytes = (value: any): Uint8Array => {
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string") return Uint8Array.from(Buffer.from(value, "base64"));
  if (Array.isArray(value)) return Uint8Array.from(value);
  // Node Buffers JSON-serialize as {type:"Buffer",data:[...]}
  if (value?.type === "Buffer" && Array.isArray(value.data)) return Uint8Array.from(value.data);
  // plain Uint8Arrays JSON-serialize as byte-index objects {"0":10,"1":42,...}
  return Uint8Array.from(Object.values(value ?? {}) as number[]);
};

// Some authorization types are not in the SDK registry (staking, wasm, ibc),
// so decode all known types through their generated codecs directly.
const authorizationCodecs: { [typeUrl: string]: { decode: (b: Uint8Array) => any } } = {
  "/cosmos.authz.v1beta1.GenericAuthorization": cosmos.authz.v1beta1.GenericAuthorization,
  "/cosmos.bank.v1beta1.SendAuthorization": cosmos.bank.v1beta1.SendAuthorization,
  "/cosmos.staking.v1beta1.StakeAuthorization": cosmos.staking.v1beta1.StakeAuthorization,
  "/cosmwasm.wasm.v1.StoreCodeAuthorization": cosmwasm.wasm.v1.StoreCodeAuthorization,
  "/cosmwasm.wasm.v1.ContractExecutionAuthorization":
    cosmwasm.wasm.v1.ContractExecutionAuthorization,
  "/cosmwasm.wasm.v1.ContractMigrationAuthorization":
    cosmwasm.wasm.v1.ContractMigrationAuthorization,
  "/ibc.applications.transfer.v1.TransferAuthorization":
    ibc.applications.transfer.v1.TransferAuthorization,
  "/ixo.claims.v1beta1.SubmitClaimAuthorization": ixo.claims.v1beta1.SubmitClaimAuthorization,
  "/ixo.claims.v1beta1.EvaluateClaimAuthorization": ixo.claims.v1beta1.EvaluateClaimAuthorization,
  "/ixo.claims.v1beta1.WithdrawPaymentAuthorization":
    ixo.claims.v1beta1.WithdrawPaymentAuthorization,
  "/ixo.claims.v1beta1.CreateClaimAuthorizationAuthorization":
    ixo.claims.v1beta1.CreateClaimAuthorizationAuthorization,
  "/ixo.token.v1beta1.MintAuthorization": ixo.token.v1beta1.MintAuthorization,
};

// Second-level Anys inside wasm ContractGrant.limit / ContractGrant.filter.
const wasmLimitFilterCodecs: { [typeUrl: string]: { decode: (b: Uint8Array) => any } } = {
  "/cosmwasm.wasm.v1.MaxCallsLimit": cosmwasm.wasm.v1.MaxCallsLimit,
  "/cosmwasm.wasm.v1.MaxFundsLimit": cosmwasm.wasm.v1.MaxFundsLimit,
  "/cosmwasm.wasm.v1.CombinedLimit": cosmwasm.wasm.v1.CombinedLimit,
  "/cosmwasm.wasm.v1.AllowAllMessagesFilter": cosmwasm.wasm.v1.AllowAllMessagesFilter,
  "/cosmwasm.wasm.v1.AcceptedMessageKeysFilter": cosmwasm.wasm.v1.AcceptedMessageKeysFilter,
  "/cosmwasm.wasm.v1.AcceptedMessagesFilter": cosmwasm.wasm.v1.AcceptedMessagesFilter,
};

const isLongLike = (v: any): boolean =>
  v !== null &&
  typeof v === "object" &&
  typeof v.low === "number" &&
  typeof v.high === "number" &&
  typeof v.unsigned === "boolean";

const longToString = (v: any): string => {
  const unsigned = BigInt.asUintN(64, (BigInt(v.high) << 32n) | BigInt(v.low >>> 0));
  return v.unsigned ? unsigned.toString() : BigInt.asIntN(64, unsigned).toString();
};

/**
 * Recursively converts a freshly-decoded protobuf object into plain
 * JSONB-safe values: Long -> string, Uint8Array -> base64, Date -> ISO.
 * Deliberately does NOT reshape {seconds, nanos} objects: Timestamp and
 * Duration are structurally identical, so converting them to dates here
 * would corrupt Duration fields (e.g. intent_duration_ns).
 */
export const sanitizeForJsonb = (value: any): any => {
  if (value === null || value === undefined) return value;
  if (value instanceof Uint8Array) return Buffer.from(value).toString("base64");
  if (value instanceof Date) return value.toISOString();
  if (isLongLike(value)) return longToString(value);
  if (Array.isArray(value)) return value.map(sanitizeForJsonb);
  if (typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeForJsonb(v);
    return out;
  }
  return value;
};

/**
 * Converts a protobuf Timestamp — in either its fresh-decoded form
 * ({seconds: Long, nanos}) or its core-DB JSON form
 * ({seconds: {low,high,unsigned}, nanos}) — to a Date. Only call this on
 * fields KNOWN to be Timestamps (e.g. Grant.expiration).
 */
export const timestampToDate = (ts: any): Date | undefined => {
  if (!ts) return undefined;
  if (typeof ts === "string") return new Date(ts);
  const seconds = isLongLike(ts.seconds) ? Number(longToString(ts.seconds)) : Number(ts.seconds);
  if (!Number.isFinite(seconds)) return undefined;
  return new Date(seconds * 1000 + Math.floor(Number(ts.nanos ?? 0) / 1e6));
};

export type DecodedAuthorization = {
  type: string;
  // JSONB-safe decoded authorization, tagged with "@type" to mirror LCD output
  value: any;
};

/**
 * Decodes an authorization `Any` ({typeUrl, value: bytes | byte-index object})
 * into JSONB-safe JSON. Unknown types are preserved as base64 rather than dropped.
 */
export const decodeAuthorization = (auth: {
  typeUrl: string;
  value: any;
}): DecodedAuthorization => {
  const bytes = toBytes(auth.value);
  let decoded: any;

  const codec = authorizationCodecs[auth.typeUrl];
  if (codec) {
    decoded = codec.decode(bytes);
  } else {
    // future/unmapped type: the registry may still know it
    decoded = decodeMessage({ typeUrl: auth.typeUrl, value: bytes });
  }

  if (!decoded) {
    console.warn(`decodeAuthorization: unknown authorization type ${auth.typeUrl}`);
    return {
      type: auth.typeUrl,
      value: {
        "@type": auth.typeUrl,
        valueBase64: Buffer.from(bytes).toString("base64"),
        _undecoded: true,
      },
    };
  }

  // wasm contract authorizations nest a second level of Anys (limit/filter)
  if (Array.isArray(decoded.grants)) {
    decoded = {
      ...decoded,
      grants: decoded.grants.map((g: any) => ({
        ...g,
        limit: g.limit?.typeUrl
          ? decodeSubAny(g.limit, wasmLimitFilterCodecs)
          : g.limit,
        filter: g.filter?.typeUrl
          ? decodeSubAny(g.filter, wasmLimitFilterCodecs)
          : g.filter,
      })),
    };
  }

  return {
    type: auth.typeUrl,
    value: { "@type": auth.typeUrl, ...sanitizeForJsonb(decoded) },
  };
};

const decodeSubAny = (
  any: { typeUrl: string; value: any },
  codecs: { [typeUrl: string]: { decode: (b: Uint8Array) => any } }
): any => {
  const codec = codecs[any.typeUrl];
  if (!codec) return { "@type": any.typeUrl, valueBase64: Buffer.from(toBytes(any.value)).toString("base64") };
  return { "@type": any.typeUrl, ...codec.decode(toBytes(any.value)) };
};

const stakeAuthzMsgByType: { [k: string]: string } = {
  AUTHORIZATION_TYPE_DELEGATE: "/cosmos.staking.v1beta1.MsgDelegate",
  AUTHORIZATION_TYPE_UNDELEGATE: "/cosmos.staking.v1beta1.MsgUndelegate",
  AUTHORIZATION_TYPE_REDELEGATE: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
  AUTHORIZATION_TYPE_CANCEL_UNBONDING_DELEGATION:
    "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation",
  "1": "/cosmos.staking.v1beta1.MsgDelegate",
  "2": "/cosmos.staking.v1beta1.MsgUndelegate",
  "3": "/cosmos.staking.v1beta1.MsgBeginRedelegate",
  "4": "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation",
};

const fixedMsgTypeByAuthorization: { [typeUrl: string]: string } = {
  "/cosmos.bank.v1beta1.SendAuthorization": "/cosmos.bank.v1beta1.MsgSend",
  "/cosmwasm.wasm.v1.StoreCodeAuthorization": "/cosmwasm.wasm.v1.MsgStoreCode",
  "/cosmwasm.wasm.v1.ContractExecutionAuthorization": "/cosmwasm.wasm.v1.MsgExecuteContract",
  "/cosmwasm.wasm.v1.ContractMigrationAuthorization": "/cosmwasm.wasm.v1.MsgMigrateContract",
  "/ibc.applications.transfer.v1.TransferAuthorization":
    "/ibc.applications.transfer.v1.MsgTransfer",
  "/ixo.claims.v1beta1.SubmitClaimAuthorization": "/ixo.claims.v1beta1.MsgSubmitClaim",
  "/ixo.claims.v1beta1.EvaluateClaimAuthorization": "/ixo.claims.v1beta1.MsgEvaluateClaim",
  "/ixo.claims.v1beta1.WithdrawPaymentAuthorization": "/ixo.claims.v1beta1.MsgWithdrawPayment",
  "/ixo.claims.v1beta1.CreateClaimAuthorizationAuthorization":
    "/ixo.claims.v1beta1.MsgCreateClaimAuthorization",
  "/ixo.token.v1beta1.MintAuthorization": "/ixo.token.v1beta1.MsgMintToken",
};

/**
 * Maps an authorization to the msg typeUrl it authorizes — the third component
 * of the chain's (granter, grantee, msgTypeUrl) grant key. Accepts both
 * LCD JSON (snake_case fields) and proto-decoded (camelCase) shapes.
 * Returns undefined for unknown authorization types.
 */
export const msgTypeUrlForAuthorization = (
  authorizationType: string,
  decoded: any
): string | undefined => {
  if (authorizationType === "/cosmos.authz.v1beta1.GenericAuthorization")
    return decoded?.msg || undefined;
  if (authorizationType === "/cosmos.staking.v1beta1.StakeAuthorization") {
    const t = decoded?.authorization_type ?? decoded?.authorizationType;
    return t === undefined ? undefined : stakeAuthzMsgByType[String(t)];
  }
  return fixedMsgTypeByAuthorization[authorizationType];
};

/**
 * Extracts the signer (= granter of the consumed grant) from a decoded
 * MsgExec inner message. ixo claim messages sign with adminAddress, which the
 * generic signer extraction in transaction_sync does not know about.
 */
export const extractGranterFromInnerMsg = (value: any): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  return (
    value.adminAddress ||
    // MsgMintToken: minter signs; its `owner` field is the mint RECIPIENT,
    // so minter must be checked before the generic owner fallback
    value.minter ||
    value.sender ||
    value.fromAddress ||
    value.owner ||
    value.ownerAddress ||
    value.delegatorAddress ||
    value.granter ||
    value.admin ||
    value.creator ||
    value.authority ||
    value.signer ||
    value.proposer ||
    value.voterAddress
  );
};
