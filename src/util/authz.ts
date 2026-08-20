import { cosmos, cosmwasm, ibc, ixo } from "@ixo/impactxclient-sdk";

// Decode + mapping helpers for event-driven authz indexing
// (sync_handlers/event_data_sync.ts authz cases).

// Nested protobuf `Any` values inside messages read back from the core DB
// survive JSON round-tripping in several shapes; normalize them to bytes.
export const toBytes = (value: any): Uint8Array => {
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string")
    return Uint8Array.from(Buffer.from(value, "base64"));
  if (Array.isArray(value)) return Uint8Array.from(value);
  // Node Buffers JSON-serialize as {type:"Buffer",data:[...]}
  if (value?.type === "Buffer" && Array.isArray(value.data))
    return Uint8Array.from(value.data);
  // plain Uint8Arrays JSON-serialize as byte-index objects {"0":10,"1":42,...}
  return Uint8Array.from(Object.values(value ?? {}) as number[]);
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

// Recursively converts a decoded protobuf object into JSONB-safe values:
// Long -> string, Uint8Array -> base64, Date -> ISO. {seconds, nanos} objects
// are deliberately NOT reshaped (Timestamp and Duration are structurally
// identical; converting blindly would corrupt Duration fields).
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

// Grant.expiration in its various shapes (registry-decoded Date serialized to
// ISO in the core DB, live Date, or a raw {seconds, nanos} Timestamp).
export const timestampToDate = (ts: any): Date | undefined => {
  if (!ts) return undefined;
  if (ts instanceof Date) return ts;
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? undefined : d;
  }
  const seconds = isLongLike(ts.seconds)
    ? Number(longToString(ts.seconds))
    : Number(ts.seconds);
  if (!Number.isFinite(seconds)) return undefined;
  return new Date(seconds * 1000 + Math.floor(Number(ts.nanos ?? 0) / 1e6));
};

// Authorization types are mostly not in the SDK's message registry; decode
// through their generated codecs directly.
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

// Decodes an authorization `Any` into "@type"-tagged JSONB-safe JSON
// (mirrors the LCD / typed-event representation). Unknown types are kept as
// base64 rather than dropped.
export const decodeAuthorizationAny = (auth: {
  typeUrl: string;
  value: any;
}): { type: string; value: any } => {
  const bytes = toBytes(auth.value);
  const codec = authorizationCodecs[auth.typeUrl];
  if (!codec) {
    return {
      type: auth.typeUrl,
      value: {
        "@type": auth.typeUrl,
        valueBase64: Buffer.from(bytes).toString("base64"),
        _undecoded: true,
      },
    };
  }
  return {
    type: auth.typeUrl,
    value: { "@type": auth.typeUrl, ...sanitizeForJsonb(codec.decode(bytes)) },
  };
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

// Maps an authorization to the msg typeUrl it authorizes — the third
// component of the chain's (granter, grantee, msgTypeUrl) grant key. Accepts
// both LCD/typed-event JSON (snake_case) and proto-decoded (camelCase) shapes.
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
