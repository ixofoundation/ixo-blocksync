import { dbQuery } from "./client";

// ==========================================================================
// NAMESPACES (governance-managed buckets of names)
// ==========================================================================

export type Namespace = {
  name: string;
  description?: string;
  registrarAccounts?: string[];
  allowSelfRegister?: boolean;
  allowRegistrarOverride?: boolean;
  minLength?: number;
  maxLength?: number;
  regex?: string;
  allowExpiry?: boolean;
  authority?: string;
  createdAtHeight?: number;
  createdAt?: Date;
  updatedAtHeight?: number;
  updatedAt?: Date;
};

// Created+Updated events both carry the full Namespace state. Upsert is the
// cleanest fit; only created/updated timestamps differ by which event fired.
const upsertNamespaceSql = `
INSERT INTO "public"."Namespace" (
  "name", "description", "registrarAccounts",
  "allowSelfRegister", "allowRegistrarOverride",
  "minLength", "maxLength", "regex", "allowExpiry",
  "authority",
  "createdAtHeight", "createdAt",
  "updatedAtHeight", "updatedAt"
)
VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
)
ON CONFLICT ("name") DO UPDATE SET
  "description" = EXCLUDED."description",
  "registrarAccounts" = EXCLUDED."registrarAccounts",
  "allowSelfRegister" = EXCLUDED."allowSelfRegister",
  "allowRegistrarOverride" = EXCLUDED."allowRegistrarOverride",
  "minLength" = EXCLUDED."minLength",
  "maxLength" = EXCLUDED."maxLength",
  "regex" = EXCLUDED."regex",
  "allowExpiry" = EXCLUDED."allowExpiry",
  "authority" = EXCLUDED."authority",
  "updatedAtHeight" = EXCLUDED."updatedAtHeight",
  "updatedAt" = EXCLUDED."updatedAt";
`;

export const upsertNamespace = async (p: Namespace): Promise<void> => {
  await dbQuery(upsertNamespaceSql, [
    p.name,
    p.description ?? "",
    p.registrarAccounts ?? [],
    p.allowSelfRegister ?? false,
    p.allowRegistrarOverride ?? false,
    p.minLength ?? 0,
    p.maxLength ?? 0,
    p.regex ?? "",
    p.allowExpiry ?? false,
    p.authority ?? null,
    p.createdAtHeight ?? null,
    p.createdAt ?? null,
    p.updatedAtHeight ?? null,
    p.updatedAt ?? null,
  ]);
};

// ==========================================================================
// NAME RECORDS (registered names bound to a DID)
// ==========================================================================

export type NameRecord = {
  namespace: string;
  normalizedName: string;
  displayName: string;
  ownerDid: string;
  verified?: boolean;
  validUntil?: number;
  status?: number;
  verifiedBy?: string;
  evidenceHash?: string;
  source?: string;
  createdAtUnix?: number;
  updatedAtUnix?: number;
  updatedAtHeight?: number;
};

const upsertNameRecordSql = `
INSERT INTO "public"."NameRecord" (
  "namespace", "normalizedName", "displayName", "ownerDid",
  "verified", "validUntil", "status",
  "verifiedBy", "evidenceHash", "source",
  "createdAtUnix", "updatedAtUnix", "updatedAtHeight"
)
VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
)
ON CONFLICT ("namespace", "normalizedName") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "ownerDid" = EXCLUDED."ownerDid",
  "verified" = EXCLUDED."verified",
  "validUntil" = EXCLUDED."validUntil",
  "status" = EXCLUDED."status",
  "verifiedBy" = EXCLUDED."verifiedBy",
  "evidenceHash" = EXCLUDED."evidenceHash",
  "source" = EXCLUDED."source",
  "updatedAtUnix" = EXCLUDED."updatedAtUnix",
  "updatedAtHeight" = EXCLUDED."updatedAtHeight";
`;

export const upsertNameRecord = async (p: NameRecord): Promise<void> => {
  await dbQuery(upsertNameRecordSql, [
    p.namespace,
    p.normalizedName,
    p.displayName,
    p.ownerDid,
    p.verified ?? false,
    p.validUntil ?? 0,
    p.status ?? 1,
    p.verifiedBy ?? null,
    p.evidenceHash ?? null,
    p.source ?? null,
    p.createdAtUnix ?? null,
    p.updatedAtUnix ?? null,
    p.updatedAtHeight ?? null,
  ]);
};

// Audit-log inserts — names module never hard-deletes; transfers and status
// changes are recorded as separate audit rows so clients can render history.

const insertNameTransferSql = `
INSERT INTO "public"."NameTransfer" (
  "namespace", "normalizedName", "fromOwnerDid", "toOwnerDid",
  "transferredBy", "height", "timestamp"
)
VALUES ( $1, $2, $3, $4, $5, $6, $7 );
`;
export const insertNameTransfer = async (p: {
  namespace: string;
  normalizedName: string;
  fromOwnerDid: string;
  toOwnerDid: string;
  transferredBy: string;
  height: number;
  timestamp: Date;
}): Promise<void> => {
  await dbQuery(insertNameTransferSql, [
    p.namespace,
    p.normalizedName,
    p.fromOwnerDid,
    p.toOwnerDid,
    p.transferredBy,
    p.height,
    p.timestamp,
  ]);
};

const insertNameStatusChangeSql = `
INSERT INTO "public"."NameStatusChange" (
  "namespace", "normalizedName", "oldStatus", "newStatus",
  "changedBy", "reason", "height", "timestamp"
)
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8 );
`;
export const insertNameStatusChange = async (p: {
  namespace: string;
  normalizedName: string;
  oldStatus: number;
  newStatus: number;
  changedBy: string;
  reason?: string;
  height: number;
  timestamp: Date;
}): Promise<void> => {
  await dbQuery(insertNameStatusChangeSql, [
    p.namespace,
    p.normalizedName,
    p.oldStatus,
    p.newStatus,
    p.changedBy,
    p.reason ?? null,
    p.height,
    p.timestamp,
  ]);
};

// Apply transfer/status changes to the current NameRecord row in addition to
// inserting an audit entry — the dedicated handlers do both, but these helpers
// keep that logic single-purpose so the sync handler stays readable.
const applyNameTransferSql = `
UPDATE "public"."NameRecord"
SET "ownerDid" = $3, "updatedAtHeight" = $4
WHERE "namespace" = $1 AND "normalizedName" = $2;
`;
export const applyNameTransfer = async (p: {
  namespace: string;
  normalizedName: string;
  toOwnerDid: string;
  height: number;
}): Promise<void> => {
  await dbQuery(applyNameTransferSql, [
    p.namespace,
    p.normalizedName,
    p.toOwnerDid,
    p.height,
  ]);
};

const applyNameStatusSql = `
UPDATE "public"."NameRecord"
SET "status" = $3, "updatedAtHeight" = $4
WHERE "namespace" = $1 AND "normalizedName" = $2;
`;
export const applyNameStatus = async (p: {
  namespace: string;
  normalizedName: string;
  newStatus: number;
  height: number;
}): Promise<void> => {
  await dbQuery(applyNameStatusSql, [
    p.namespace,
    p.normalizedName,
    p.newStatus,
    p.height,
  ]);
};
