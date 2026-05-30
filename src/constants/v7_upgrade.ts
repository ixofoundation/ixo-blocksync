import { NETWORK } from "../util/secrets";

/**
 * Per-network block height at which the **v7 chain upgrade** is applied.
 *
 * Why this exists: the v7 upgrade handler (`app/upgrades/v7` in ixo-blockchain)
 * does two **silent KV writes** at the upgrade block that the indexer would
 * otherwise miss because they don't surface as wasm/typed events:
 *
 *   1. liquidstake: writes `ModuleParams` + the legacy "zero" `Pool` (with
 *      pre-v7 single-pool config copied over), and re-keys all per-validator
 *      records under the new per-pool prefix. No PoolCreatedEvent fires.
 *
 *   2. claims (v3 → v4 store migration): scans every existing `Dispute` and
 *      stamps `status = DISMISSED` on those with `target_role = UNSPECIFIED`
 *      (i.e. filed pre-v7). No DisputeResolvedEvent fires.
 *
 * On crossing this height the indexer runs a one-shot snapshot that mirrors
 * those state changes into the local DB, then backfills any post-v7 derived
 * fields on existing rows (e.g. `LiquidStakeTx.poolId = "zero"` for txs
 * recorded with empty poolId pre-v7).
 *
 * **Status:** as of 2026-05-27, v7 has not yet been applied on any of the
 * three networks (`applied_plan/v7 = 0` everywhere). The values here are
 * therefore `0` (disabled). Update the appropriate entry once the chain
 * upgrade goes live, OR set `V7_UPGRADE_HEIGHT` env var to override at
 * deploy time.
 */
export const V7_UPGRADE_HEIGHTS: Record<string, number> = {
  devnet: 0,
  testnet: 0,
  mainnet: 0,
};

// Env override. Same shape as DAODAO_CUTOFF_HEIGHT — set to a positive
// integer to force-enable, or 0 to disable.
const overrideRaw = process.env.V7_UPGRADE_HEIGHT;
const overrideParsed = overrideRaw !== undefined ? Number(overrideRaw) : NaN;

export const V7_UPGRADE_HEIGHT: number = Number.isFinite(overrideParsed)
  ? overrideParsed
  : (V7_UPGRADE_HEIGHTS[NETWORK] ?? 0);

/**
 * Pool ID that the v7 chain migration assigns to the migrated pre-v7
 * single-pool state. Matches `LegacyPoolID` in
 * `ixo-blockchain/app/upgrades/v7/constants.go:18`.
 *
 * After the snapshot runs, every pre-v7 LiquidStakeTx row that was indexed
 * with `poolId=""` gets rewritten to this value so post-upgrade dashboards
 * can group activity by pool consistently.
 */
export const V7_LEGACY_POOL_ID = "zero";
