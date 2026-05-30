import { dbQuery } from "./client";

// ==========================================================================
// LIQUIDSTAKE v7 MULTI-POOL
// ==========================================================================

export type LiquidStakePool = {
  poolId: string;
  liquidBondDenom: string;
  proxyAccountAddress: string;
  whitelistedValidators: any; // JSON [{validator_address, target_weight}]
  unstakeFeeRate: string;
  feeAccountAddress: string;
  autocompoundFeeRate: string;
  whitelistAdminAddress: string;
  paused: boolean;
  weightedRewardsReceivers: any; // JSON [{address, weight}]
  createdAtHeight?: number;
  updatedAtHeight?: number;
  updatedAt?: Date;
};

// PoolCreated and PoolUpdated both carry the full Pool; upsert keeps the row
// in step with the latest event without distinguishing the two paths.
const upsertLiquidStakePoolSql = `
INSERT INTO "public"."LiquidStakePool" (
  "poolId", "liquidBondDenom", "proxyAccountAddress",
  "whitelistedValidators", "unstakeFeeRate", "feeAccountAddress",
  "autocompoundFeeRate", "whitelistAdminAddress", "paused",
  "weightedRewardsReceivers",
  "createdAtHeight", "updatedAtHeight", "updatedAt"
)
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13 )
ON CONFLICT ("poolId") DO UPDATE SET
  "liquidBondDenom" = EXCLUDED."liquidBondDenom",
  "proxyAccountAddress" = EXCLUDED."proxyAccountAddress",
  "whitelistedValidators" = EXCLUDED."whitelistedValidators",
  "unstakeFeeRate" = EXCLUDED."unstakeFeeRate",
  "feeAccountAddress" = EXCLUDED."feeAccountAddress",
  "autocompoundFeeRate" = EXCLUDED."autocompoundFeeRate",
  "whitelistAdminAddress" = EXCLUDED."whitelistAdminAddress",
  "paused" = EXCLUDED."paused",
  "weightedRewardsReceivers" = EXCLUDED."weightedRewardsReceivers",
  "updatedAtHeight" = EXCLUDED."updatedAtHeight",
  "updatedAt" = EXCLUDED."updatedAt";
`;

export const upsertLiquidStakePool = async (
  p: LiquidStakePool,
): Promise<void> => {
  await dbQuery(upsertLiquidStakePoolSql, [
    p.poolId,
    p.liquidBondDenom,
    p.proxyAccountAddress,
    JSON.stringify(p.whitelistedValidators ?? []),
    p.unstakeFeeRate,
    p.feeAccountAddress,
    p.autocompoundFeeRate,
    p.whitelistAdminAddress,
    p.paused,
    JSON.stringify(p.weightedRewardsReceivers ?? []),
    p.createdAtHeight ?? null,
    p.updatedAtHeight ?? null,
    p.updatedAt ?? null,
  ]);
};

// Singleton — pkey + check constraint ensures only one row exists.
const upsertModuleParamsSql = `
INSERT INTO "public"."LiquidStakeModuleParams" (
  "id", "minLiquidStakeAmount", "modulePaused",
  "updatedAtHeight", "updatedAt"
)
VALUES ( 1, $1, $2, $3, $4 )
ON CONFLICT ("id") DO UPDATE SET
  "minLiquidStakeAmount" = EXCLUDED."minLiquidStakeAmount",
  "modulePaused" = EXCLUDED."modulePaused",
  "updatedAtHeight" = EXCLUDED."updatedAtHeight",
  "updatedAt" = EXCLUDED."updatedAt";
`;
export const upsertLiquidStakeModuleParams = async (p: {
  minLiquidStakeAmount: string;
  modulePaused: boolean;
  updatedAtHeight?: number;
  updatedAt?: Date;
}): Promise<void> => {
  await dbQuery(upsertModuleParamsSql, [
    p.minLiquidStakeAmount,
    p.modulePaused,
    p.updatedAtHeight ?? null,
    p.updatedAt ?? null,
  ]);
};

const insertLiquidStakeTxSql = `
INSERT INTO "public"."LiquidStakeTx" (
  "kind", "poolId", "delegator", "payload",
  "transactionHash", "height", "timestamp"
)
VALUES ( $1, $2, $3, $4, $5, $6, $7 );
`;
export const insertLiquidStakeTx = async (p: {
  kind: string;
  poolId: string;
  delegator?: string;
  payload: any;
  transactionHash?: string;
  height: number;
  timestamp: Date;
}): Promise<void> => {
  await dbQuery(insertLiquidStakeTxSql, [
    p.kind,
    p.poolId,
    p.delegator ?? null,
    JSON.stringify(p.payload ?? {}),
    p.transactionHash ?? null,
    p.height,
    p.timestamp,
  ]);
};

// =============================================
// V7 snapshot helpers
// =============================================
// Rewrite all pre-v7 LiquidStakeTx rows that came in with poolId="" (the
// chain didn't emit pool_id on pre-v7 events) to the migrated legacy
// pool id, so post-upgrade queries grouping by pool work consistently.
// `beforeHeight` is the v7 upgrade block — we only rewrite rows recorded
// strictly before that height, because any post-upgrade row with an
// empty poolId would indicate a real bug we shouldn't paper over.
export const relinkLegacyLiquidStakeTxPoolId = async (
  legacyPoolId: string,
  beforeHeight: number
): Promise<number> => {
  const r = await dbQuery(
    `UPDATE "LiquidStakeTx" SET "poolId" = $1
       WHERE "poolId" = '' AND "height" < $2
     RETURNING id;`,
    [legacyPoolId, beforeHeight]
  );
  return r.rowCount ?? 0;
};
