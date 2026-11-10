-- Up Migration

-- Every time this indexer stores is UTC, but the columns were TIMESTAMP(3)
-- (no zone), so the API returned "2026-11-10T05:16:47.319" with no zone and
-- browsers read it as local time: a proposal made a minute ago showed as
-- "8h ago" in Singapore. TIMESTAMPTZ(3) stores the same instants and the API
-- returns them as "2026-11-10T05:16:47.319+00:00".
--
-- This file: every other table with a time column (all small).
--
-- The stored values are read as UTC explicitly (AT TIME ZONE 'UTC'), so the
-- result does not depend on the session's time zone. Precision stays at
-- milliseconds, which keeps the unique indexes and the API's output digits as
-- they were; that makes Postgres rewrite the table and its indexes under an
-- ACCESS EXCLUSIVE lock (measured 2026-11-10: every affected table together is
-- under 1 GB on mainnet). ANALYZE restores the planner statistics that a type
-- change drops.
--
-- After this runs, restart ixo-blocksync-api: it reads column types once at
-- boot and keeps printing times without a zone until then.

ALTER TABLE "AgentDepositBalance"
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "withdrawableAt" TYPE TIMESTAMPTZ(3) USING "withdrawableAt" AT TIME ZONE 'UTC';

ALTER TABLE "BondAlpha"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "BondBuy"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "BondSell"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "BondSwap"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "ClaimCollection"
  ALTER COLUMN "endDate" TYPE TIMESTAMPTZ(3) USING "endDate" AT TIME ZONE 'UTC',
  ALTER COLUMN "startDate" TYPE TIMESTAMPTZ(3) USING "startDate" AT TIME ZONE 'UTC';

ALTER TABLE "dao_core"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "paused_until" TYPE TIMESTAMPTZ(3) USING "paused_until" AT TIME ZONE 'UTC';

ALTER TABLE "dao_core_item"
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_pre_propose_approval"
  ALTER COLUMN "resolved_at" TYPE TIMESTAMPTZ(3) USING "resolved_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "submitted_at" TYPE TIMESTAMPTZ(3) USING "submitted_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_pre_propose_module"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_proposal"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_proposal_hook"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_proposal_module"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_staking_claim"
  ALTER COLUMN "claimed_at" TYPE TIMESTAMPTZ(3) USING "claimed_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "release_at" TYPE TIMESTAMPTZ(3) USING "release_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_sub_dao"
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_vote"
  ALTER COLUMN "voted_at" TYPE TIMESTAMPTZ(3) USING "voted_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_vote_hook"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_voting_module"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "daodao_snapshot_state"
  ALTER COLUMN "completed_at" TYPE TIMESTAMPTZ(3) USING "completed_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "started_at" TYPE TIMESTAMPTZ(3) USING "started_at" AT TIME ZONE 'UTC';

ALTER TABLE "Dispute"
  ALTER COLUMN "submittedAt" TYPE TIMESTAMPTZ(3) USING "submittedAt" AT TIME ZONE 'UTC';

ALTER TABLE "DisputeResolution"
  ALTER COLUMN "resolvedAt" TYPE TIMESTAMPTZ(3) USING "resolvedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Entity"
  ALTER COLUMN "endDate" TYPE TIMESTAMPTZ(3) USING "endDate" AT TIME ZONE 'UTC',
  ALTER COLUMN "startDate" TYPE TIMESTAMPTZ(3) USING "startDate" AT TIME ZONE 'UTC';

ALTER TABLE "epoch"
  ALTER COLUMN "current_epoch_start_time" TYPE TIMESTAMPTZ(3) USING "current_epoch_start_time" AT TIME ZONE 'UTC',
  ALTER COLUMN "start_time" TYPE TIMESTAMPTZ(3) USING "start_time" AT TIME ZONE 'UTC';

ALTER TABLE "epoch_event"
  ALTER COLUMN "end_time" TYPE TIMESTAMPTZ(3) USING "end_time" AT TIME ZONE 'UTC',
  ALTER COLUMN "start_time" TYPE TIMESTAMPTZ(3) USING "start_time" AT TIME ZONE 'UTC';

ALTER TABLE "ixo_swap_price_history"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "LiquidStakeModuleParams"
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "LiquidStakePool"
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "LiquidStakeTx"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "MemberBudget"
  ALTER COLUMN "periodResetAt" TYPE TIMESTAMPTZ(3) USING "periodResetAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Namespace"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "NameStatusChange"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "NameTransfer"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "OutcomePayment"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "ReserveWithdrawal"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "ShareWithdrawal"
  ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "smart_account_authenticator"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "v7_snapshot_state"
  ALTER COLUMN "completed_at" TYPE TIMESTAMPTZ(3) USING "completed_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "started_at" TYPE TIMESTAMPTZ(3) USING "started_at" AT TIME ZONE 'UTC';

ALTER TABLE "wasm_instantiate"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

ANALYZE "AgentDepositBalance" ("updatedAt", "withdrawableAt");
ANALYZE "BondAlpha" ("timestamp");
ANALYZE "BondBuy" ("timestamp");
ANALYZE "BondSell" ("timestamp");
ANALYZE "BondSwap" ("timestamp");
ANALYZE "ClaimCollection" ("endDate", "startDate");
ANALYZE "dao_core" ("created_at", "paused_until");
ANALYZE "dao_core_item" ("updated_at");
ANALYZE "dao_pre_propose_approval" ("resolved_at", "submitted_at");
ANALYZE "dao_pre_propose_module" ("created_at");
ANALYZE "dao_proposal" ("created_at");
ANALYZE "dao_proposal_hook" ("created_at");
ANALYZE "dao_proposal_module" ("created_at");
ANALYZE "dao_staking_claim" ("claimed_at", "release_at");
ANALYZE "dao_sub_dao" ("updated_at");
ANALYZE "dao_vote" ("voted_at");
ANALYZE "dao_vote_hook" ("created_at");
ANALYZE "dao_voting_module" ("created_at");
ANALYZE "daodao_snapshot_state" ("completed_at", "started_at");
ANALYZE "Dispute" ("submittedAt");
ANALYZE "DisputeResolution" ("resolvedAt");
ANALYZE "Entity" ("endDate", "startDate");
ANALYZE "epoch" ("current_epoch_start_time", "start_time");
ANALYZE "epoch_event" ("end_time", "start_time");
ANALYZE "ixo_swap_price_history" ("timestamp");
ANALYZE "LiquidStakeModuleParams" ("updatedAt");
ANALYZE "LiquidStakePool" ("updatedAt");
ANALYZE "LiquidStakeTx" ("timestamp");
ANALYZE "MemberBudget" ("periodResetAt", "updatedAt");
ANALYZE "Namespace" ("createdAt", "updatedAt");
ANALYZE "NameStatusChange" ("timestamp");
ANALYZE "NameTransfer" ("timestamp");
ANALYZE "OutcomePayment" ("timestamp");
ANALYZE "ReserveWithdrawal" ("timestamp");
ANALYZE "ShareWithdrawal" ("timestamp");
ANALYZE "smart_account_authenticator" ("created_at");
ANALYZE "v7_snapshot_state" ("completed_at", "started_at");
ANALYZE "wasm_instantiate" ("created_at");

-- Down Migration

ALTER TABLE "AgentDepositBalance"
  ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3) USING "updatedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "withdrawableAt" TYPE TIMESTAMP(3) USING "withdrawableAt" AT TIME ZONE 'UTC';

ALTER TABLE "BondAlpha"
  ALTER COLUMN "timestamp" TYPE TIMESTAMP(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "BondBuy"
  ALTER COLUMN "timestamp" TYPE TIMESTAMP(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "BondSell"
  ALTER COLUMN "timestamp" TYPE TIMESTAMP(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "BondSwap"
  ALTER COLUMN "timestamp" TYPE TIMESTAMP(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "ClaimCollection"
  ALTER COLUMN "endDate" TYPE TIMESTAMP(3) USING "endDate" AT TIME ZONE 'UTC',
  ALTER COLUMN "startDate" TYPE TIMESTAMP(3) USING "startDate" AT TIME ZONE 'UTC';

ALTER TABLE "dao_core"
  ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "paused_until" TYPE TIMESTAMP(3) USING "paused_until" AT TIME ZONE 'UTC';

ALTER TABLE "dao_core_item"
  ALTER COLUMN "updated_at" TYPE TIMESTAMP(3) USING "updated_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_pre_propose_approval"
  ALTER COLUMN "resolved_at" TYPE TIMESTAMP(3) USING "resolved_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "submitted_at" TYPE TIMESTAMP(3) USING "submitted_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_pre_propose_module"
  ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_proposal"
  ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_proposal_hook"
  ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_proposal_module"
  ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_staking_claim"
  ALTER COLUMN "claimed_at" TYPE TIMESTAMP(3) USING "claimed_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "release_at" TYPE TIMESTAMP(3) USING "release_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_sub_dao"
  ALTER COLUMN "updated_at" TYPE TIMESTAMP(3) USING "updated_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_vote"
  ALTER COLUMN "voted_at" TYPE TIMESTAMP(3) USING "voted_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_vote_hook"
  ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "dao_voting_module"
  ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "daodao_snapshot_state"
  ALTER COLUMN "completed_at" TYPE TIMESTAMP(3) USING "completed_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "started_at" TYPE TIMESTAMP(3) USING "started_at" AT TIME ZONE 'UTC';

ALTER TABLE "Dispute"
  ALTER COLUMN "submittedAt" TYPE TIMESTAMP(3) USING "submittedAt" AT TIME ZONE 'UTC';

ALTER TABLE "DisputeResolution"
  ALTER COLUMN "resolvedAt" TYPE TIMESTAMP(3) USING "resolvedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Entity"
  ALTER COLUMN "endDate" TYPE TIMESTAMP(3) USING "endDate" AT TIME ZONE 'UTC',
  ALTER COLUMN "startDate" TYPE TIMESTAMP(3) USING "startDate" AT TIME ZONE 'UTC';

ALTER TABLE "epoch"
  ALTER COLUMN "current_epoch_start_time" TYPE TIMESTAMP(3) USING "current_epoch_start_time" AT TIME ZONE 'UTC',
  ALTER COLUMN "start_time" TYPE TIMESTAMP(3) USING "start_time" AT TIME ZONE 'UTC';

ALTER TABLE "epoch_event"
  ALTER COLUMN "end_time" TYPE TIMESTAMP(3) USING "end_time" AT TIME ZONE 'UTC',
  ALTER COLUMN "start_time" TYPE TIMESTAMP(3) USING "start_time" AT TIME ZONE 'UTC';

ALTER TABLE "ixo_swap_price_history"
  ALTER COLUMN "timestamp" TYPE TIMESTAMP(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "LiquidStakeModuleParams"
  ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "LiquidStakePool"
  ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "LiquidStakeTx"
  ALTER COLUMN "timestamp" TYPE TIMESTAMP(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "MemberBudget"
  ALTER COLUMN "periodResetAt" TYPE TIMESTAMP(3) USING "periodResetAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Namespace"
  ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "NameStatusChange"
  ALTER COLUMN "timestamp" TYPE TIMESTAMP(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "NameTransfer"
  ALTER COLUMN "timestamp" TYPE TIMESTAMP(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "OutcomePayment"
  ALTER COLUMN "timestamp" TYPE TIMESTAMP(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "ReserveWithdrawal"
  ALTER COLUMN "timestamp" TYPE TIMESTAMP(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "ShareWithdrawal"
  ALTER COLUMN "timestamp" TYPE TIMESTAMP(3) USING "timestamp" AT TIME ZONE 'UTC';

ALTER TABLE "smart_account_authenticator"
  ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "v7_snapshot_state"
  ALTER COLUMN "completed_at" TYPE TIMESTAMP(3) USING "completed_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "started_at" TYPE TIMESTAMP(3) USING "started_at" AT TIME ZONE 'UTC';

ALTER TABLE "wasm_instantiate"
  ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING "created_at" AT TIME ZONE 'UTC';

ANALYZE "AgentDepositBalance" ("updatedAt", "withdrawableAt");
ANALYZE "BondAlpha" ("timestamp");
ANALYZE "BondBuy" ("timestamp");
ANALYZE "BondSell" ("timestamp");
ANALYZE "BondSwap" ("timestamp");
ANALYZE "ClaimCollection" ("endDate", "startDate");
ANALYZE "dao_core" ("created_at", "paused_until");
ANALYZE "dao_core_item" ("updated_at");
ANALYZE "dao_pre_propose_approval" ("resolved_at", "submitted_at");
ANALYZE "dao_pre_propose_module" ("created_at");
ANALYZE "dao_proposal" ("created_at");
ANALYZE "dao_proposal_hook" ("created_at");
ANALYZE "dao_proposal_module" ("created_at");
ANALYZE "dao_staking_claim" ("claimed_at", "release_at");
ANALYZE "dao_sub_dao" ("updated_at");
ANALYZE "dao_vote" ("voted_at");
ANALYZE "dao_vote_hook" ("created_at");
ANALYZE "dao_voting_module" ("created_at");
ANALYZE "daodao_snapshot_state" ("completed_at", "started_at");
ANALYZE "Dispute" ("submittedAt");
ANALYZE "DisputeResolution" ("resolvedAt");
ANALYZE "Entity" ("endDate", "startDate");
ANALYZE "epoch" ("current_epoch_start_time", "start_time");
ANALYZE "epoch_event" ("end_time", "start_time");
ANALYZE "ixo_swap_price_history" ("timestamp");
ANALYZE "LiquidStakeModuleParams" ("updatedAt");
ANALYZE "LiquidStakePool" ("updatedAt");
ANALYZE "LiquidStakeTx" ("timestamp");
ANALYZE "MemberBudget" ("periodResetAt", "updatedAt");
ANALYZE "Namespace" ("createdAt", "updatedAt");
ANALYZE "NameStatusChange" ("timestamp");
ANALYZE "NameTransfer" ("timestamp");
ANALYZE "OutcomePayment" ("timestamp");
ANALYZE "ReserveWithdrawal" ("timestamp");
ANALYZE "ShareWithdrawal" ("timestamp");
ANALYZE "smart_account_authenticator" ("created_at");
ANALYZE "v7_snapshot_state" ("completed_at", "started_at");
ANALYZE "wasm_instantiate" ("created_at");
