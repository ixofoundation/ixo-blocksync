-- Up Migration
-- v7 chain upgrade: indexes new claims features (member budgets,
-- performance deposits, dispute resolution, FLAGGED status, quota updates),
-- the new chain-level names module, and the multi-pool liquidstake refactor.
--
-- All ALTER TABLE columns are nullable / defaulted so this migration is
-- backward compatible with any pre-v7 rows that were already indexed.

-- ==========================================================================
-- DAO PROPOSAL MODULE: backfill prefix/status columns
-- ==========================================================================
-- The DaoProposalModule TypeScript type carried prefix/status all along but
-- the original init migration never added the columns. Indexer now fills
-- them on instantiate from the parent DAO's dump_state.proposal_modules
-- list, so the read path works for multi-prop-module DAOs (e.g. a DAO with
-- both single-choice and multiple-choice modules in parallel).
ALTER TABLE dao_proposal_module ADD COLUMN IF NOT EXISTS prefix TEXT;
ALTER TABLE dao_proposal_module ADD COLUMN IF NOT EXISTS status TEXT;

-- ==========================================================================
-- DAO CORE ITEMS — arbitrary key/value metadata a DAO sets on itself
-- ==========================================================================
-- The dao-core contract exposes `execute_set_item` and `execute_remove_item`
-- so a DAO can store free-form key/value entries (typical use: UI metadata
-- like banner_url, twitter_handle, additional contract addresses the DAO
-- references). These are settable only via passed proposals, so each row's
-- last-write block height is the proposal-execute height.
CREATE TABLE dao_core_item (
    dao_address TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    block_height INTEGER NOT NULL,
    PRIMARY KEY (dao_address, key),
    FOREIGN KEY (dao_address) REFERENCES dao_core(address)
);
CREATE INDEX dao_core_item_dao_address_idx ON dao_core_item(dao_address);

-- ==========================================================================
-- CLAIM COLLECTION: new v7 fields
-- ==========================================================================

-- FLAGGED evaluation status counters
ALTER TABLE "ClaimCollection" ADD COLUMN "flagged" NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE "ClaimCollection" ADD COLUMN "flaggedActive" NUMERIC NOT NULL DEFAULT 0;

-- Performance deposit gates
ALTER TABLE "ClaimCollection" ADD COLUMN "serviceAgentDepositRequired" JSONB;
ALTER TABLE "ClaimCollection" ADD COLUMN "evaluatorDepositRequired" JSONB;

-- Dispute deposits and penalties
ALTER TABLE "ClaimCollection" ADD COLUMN "disputeDepositAmount" JSONB;
ALTER TABLE "ClaimCollection" ADD COLUMN "penaltyAmountPerDispute" JSONB;

-- Per-collection dispute counters
ALTER TABLE "ClaimCollection" ADD COLUMN "disputesOpen" NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE "ClaimCollection" ADD COLUMN "disputesAwarded" NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE "ClaimCollection" ADD COLUMN "disputesDismissed" NUMERIC NOT NULL DEFAULT 0;

-- min_deposit_period stored as nanoseconds (matches proto Duration)
ALTER TABLE "ClaimCollection" ADD COLUMN "minDepositPeriodNs" NUMERIC NOT NULL DEFAULT 0;

-- adjudicators whitelist: [{did, reward_percentage}, ...]
ALTER TABLE "ClaimCollection" ADD COLUMN "adjudicators" JSONB;

-- ==========================================================================
-- CLAIM: v7 fields
-- ==========================================================================

-- Team-member attribution
ALTER TABLE "Claim" ADD COLUMN "memberAddress" TEXT;

CREATE INDEX "Claim_memberAddress_idx" ON "Claim"("memberAddress");

-- ==========================================================================
-- EVALUATION: re-model for FLAGGED history
-- ==========================================================================
-- Pre-v7 schema had Evaluation.claimId as PRIMARY KEY (one evaluation per
-- claim, overwritten on re-evaluation). v7's FLAGGED feature lets the same
-- claim move through multiple evaluations: FLAGGED → (possibly re-FLAGGED by
-- a different agent) → terminal (APPROVED / REJECTED / INVALIDATED). The
-- chain keeps the full history in Claim.evaluation_history, and we want it
-- queryable rather than buried in a JSONB blob on Claim.
--
-- New shape: append-only table, synthetic PK, unique on the natural key
-- (claimId, agentAddress, evaluationDate). "Current" evaluation = the row
-- with the highest evaluationDate for a given claimId (the descending
-- composite index below makes that an O(log n) lookup).

ALTER TABLE "Evaluation" DROP CONSTRAINT IF EXISTS "Evaluation_pkey";
ALTER TABLE "Evaluation" ADD COLUMN "id" BIGSERIAL PRIMARY KEY;

-- Same (agent, evaluationDate) on the same claim can only happen if the
-- chain re-emits the same event during a re-index — DO NOTHING on conflict.
ALTER TABLE "Evaluation"
  ADD CONSTRAINT "Evaluation_claim_agent_date_uniq"
  UNIQUE ("claimId", "agentAddress", "evaluationDate");

-- "Latest evaluation per claim" is the dominant read pattern.
CREATE INDEX "Evaluation_claimId_evaluationDate_idx"
  ON "Evaluation"("claimId", "evaluationDate" DESC);

-- Convenience index for "all evaluations by this agent."
CREATE INDEX "Evaluation_agentAddress_idx" ON "Evaluation"("agentAddress");

-- Pointer to the current (latest) Evaluation row, so Postgraphile can keep
-- exposing the pre-v7 GraphQL `Claim.evaluation` (singular) shape that
-- clients depend on. The unique-by-PK on Evaluation(id) makes this a 1:1
-- forward relation; the smart tag in src/graphql/smart_tags_plugin.ts
-- renames the auto-generated field from `currentEvaluation` back to
-- `evaluation`. The 1:N backward relation is still exposed alongside it
-- as the evaluations connection on Claim, so history is queryable too.
ALTER TABLE "Claim" ADD COLUMN "currentEvaluationId" BIGINT;
ALTER TABLE "Claim"
  ADD CONSTRAINT "Claim_currentEvaluationId_fkey"
  FOREIGN KEY ("currentEvaluationId") REFERENCES "Evaluation"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX "Claim_currentEvaluationId_idx"
  ON "Claim"("currentEvaluationId");

-- ==========================================================================
-- DISPUTE: full v7 re-model
-- ==========================================================================
-- Previous schema keyed disputes on `proof`, which is no longer unique: a
-- single (subjectId, target_role) pair can hold multiple disputes over time
-- (e.g. an OPEN one resolved DISMISSED, then a fresh OPEN one with new
-- evidence). v7 introduces target_role, status, resolution, and a deposit.

-- Drop the old PK (data is wiped for v7 testing per the user instructions)
ALTER TABLE "Dispute" DROP CONSTRAINT IF EXISTS "Dispute_pkey";

-- Synthetic primary key: cheap, lets multiple disputes share (subjectId,
-- target_role) over their lifecycle while still enforcing the "at most one
-- OPEN per (subject_id, target_role)" rule via a partial
-- unique index below.
ALTER TABLE "Dispute" ADD COLUMN "id" BIGSERIAL PRIMARY KEY;

-- Make legacy `proof` nullable — v7 disputes carry structured DisputeData
-- (uri + proof + type + encrypted) in `data`, not a top-level proof string.
ALTER TABLE "Dispute" ALTER COLUMN "proof" DROP NOT NULL;

-- v7 dispute fields
ALTER TABLE "Dispute" ADD COLUMN "targetRole" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Dispute" ADD COLUMN "disputerAddress" TEXT;
ALTER TABLE "Dispute" ADD COLUMN "disputerDid" TEXT;
ALTER TABLE "Dispute" ADD COLUMN "disputeDeposit" JSONB;
ALTER TABLE "Dispute" ADD COLUMN "submittedAt" TIMESTAMP(3);
ALTER TABLE "Dispute" ADD COLUMN "status" INTEGER NOT NULL DEFAULT 0;
-- Note: resolution data lives in its own DisputeResolution table below
-- (1:1 with Dispute via FK on disputeId), so individual fields like
-- adjudicator, penalty paid, winner/loser are queryable / filterable
-- instead of being buried in a JSONB blob.

-- Lookup indexes (status is heavily filtered, claims page wants disputes
-- by subjectId, and "is there an open dispute against me as evaluator?"
-- comes up at submit time).
CREATE INDEX "Dispute_subjectId_idx" ON "Dispute"("subjectId");
CREATE INDEX "Dispute_subjectId_targetRole_status_idx"
  ON "Dispute"("subjectId", "targetRole", "status");
CREATE INDEX "Dispute_disputerAddress_idx" ON "Dispute"("disputerAddress");

-- Enforce "at most one OPEN per (subject, target_role)" at the DB level —
-- mirrors the chain-level invariant fro
CREATE UNIQUE INDEX "Dispute_open_per_subject_target_uniq"
  ON "Dispute"("subjectId", "targetRole")
  WHERE "status" = 0;

-- ==========================================================================
-- DISPUTE RESOLUTION: 1:1 child of Dispute, written on adjudication
-- ==========================================================================
-- Pulled out of the previously-planned `Dispute.resolution` JSONB so each
-- field is a real column — adjudicator filtering, penalty aggregation, and
-- winner/loser dashboards all work without JSONB digging.
--
-- Population: indexer's disputeResolved handler does
--   UPDATE Dispute SET status = $newStatus WHERE … RETURNING id
--   INSERT INTO DisputeResolution (disputeId, …) VALUES (…)
-- in a single CTE so it's atomic with the status flip.
--
-- 1:1 enforced by disputeId being both PK and FK.
CREATE TABLE "DisputeResolution" (
  "disputeId" BIGINT NOT NULL,
  "adjudicatorDid" TEXT NOT NULL,
  "adjudicatorAddress" TEXT NOT NULL,
  -- where the adjudicator's share was actually paid (may differ from
  -- adjudicatorAddress when the adjudicator DID has an entity module
  -- account that captures revenue).
  "adjudicatorPayoutAddress" TEXT NOT NULL,
  "resolvedAt" TIMESTAMP(3) NOT NULL,
  -- DisputeData payload (uri + proof + type + encrypted). Nullable
  -- because the adjudicator may resolve without an attached document.
  "data" JSONB,
  -- intendedPenalty: what the adjudicator asked for (or the collection's
  -- fixed penalty_amount_per_dispute). actualPenaltyPaid: what was
  -- actually slashed (capped by the loser's available balance / deposit).
  -- Coin arrays — JSONB to preserve full Uint128 precision in the
  -- amount strings.
  "intendedPenalty" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "actualPenaltyPaid" JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- winnerAmount + adjudicatorAmount split together equal actualPenaltyPaid
  -- (plus the dispute_deposit refund/forfeit, depending on outcome).
  "winnerAmount" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "adjudicatorAmount" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "winnerAddress" TEXT NOT NULL,
  "loserAddress" TEXT NOT NULL,
  CONSTRAINT "DisputeResolution_pkey" PRIMARY KEY ("disputeId"),
  CONSTRAINT "DisputeResolution_disputeId_fkey"
    FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
-- "All disputes ruled on by adjudicator X" — common dashboard query.
CREATE INDEX "DisputeResolution_adjudicatorAddress_idx"
  ON "DisputeResolution"("adjudicatorAddress");
CREATE INDEX "DisputeResolution_adjudicatorDid_idx"
  ON "DisputeResolution"("adjudicatorDid");
-- "All disputes I've won / lost" pages.
CREATE INDEX "DisputeResolution_winnerAddress_idx"
  ON "DisputeResolution"("winnerAddress");
CREATE INDEX "DisputeResolution_loserAddress_idx"
  ON "DisputeResolution"("loserAddress");
-- Recent-resolutions feed.
CREATE INDEX "DisputeResolution_resolvedAt_idx"
  ON "DisputeResolution"("resolvedAt" DESC);

-- ==========================================================================
-- MEMBER BUDGET
-- ==========================================================================
CREATE TABLE "MemberBudget" (
  "collectionId" TEXT NOT NULL,
  "memberAddress" TEXT NOT NULL,
  -- proto Duration → stored as nanoseconds
  "periodNs" NUMERIC NOT NULL,
  "periodSpendLimit" JSONB NOT NULL,
  "periodSpent" JSONB NOT NULL,
  "periodCw20SpendLimit" JSONB,
  "periodCw20Spent" JSONB,
  "periodResetAt" TIMESTAMP(3) NOT NULL,
  "updatedAtHeight" BIGINT,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "MemberBudget_pkey" PRIMARY KEY ("collectionId", "memberAddress")
);
CREATE INDEX "MemberBudget_memberAddress_idx" ON "MemberBudget"("memberAddress");

-- ==========================================================================
-- AGENT DEPOSIT BALANCE
-- ==========================================================================
CREATE TABLE "AgentDepositBalance" (
  "collectionId" TEXT NOT NULL,
  "agentAddress" TEXT NOT NULL,
  "amount" JSONB NOT NULL,
  "withdrawableAt" TIMESTAMP(3) NOT NULL,
  "updatedAtHeight" BIGINT,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "AgentDepositBalance_pkey"
    PRIMARY KEY ("collectionId", "agentAddress")
);
CREATE INDEX "AgentDepositBalance_agentAddress_idx"
  ON "AgentDepositBalance"("agentAddress");

-- ==========================================================================
-- NAMES MODULE
-- ==========================================================================
CREATE TABLE "Namespace" (
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "registrarAccounts" TEXT[] NOT NULL DEFAULT '{}',
  "allowSelfRegister" BOOLEAN NOT NULL DEFAULT FALSE,
  "allowRegistrarOverride" BOOLEAN NOT NULL DEFAULT FALSE,
  "minLength" INTEGER NOT NULL DEFAULT 0,
  "maxLength" INTEGER NOT NULL DEFAULT 0,
  "regex" TEXT NOT NULL DEFAULT '',
  "allowExpiry" BOOLEAN NOT NULL DEFAULT FALSE,
  "authority" TEXT,
  "createdAtHeight" BIGINT,
  "createdAt" TIMESTAMP(3),
  "updatedAtHeight" BIGINT,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "Namespace_pkey" PRIMARY KEY ("name")
);

CREATE TABLE "NameRecord" (
  "namespace" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "ownerDid" TEXT NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "validUntil" BIGINT NOT NULL DEFAULT 0,
  "status" INTEGER NOT NULL DEFAULT 1,
  "verifiedBy" TEXT,
  "evidenceHash" TEXT,
  "source" TEXT,
  -- chain-supplied unix timestamps (seconds) so indexers don't have to
  -- re-derive from block time
  "createdAtUnix" BIGINT,
  "updatedAtUnix" BIGINT,
  -- block height of the last write, useful for re-orgs
  "updatedAtHeight" BIGINT,
  CONSTRAINT "NameRecord_pkey" PRIMARY KEY ("namespace", "normalizedName")
);
CREATE INDEX "NameRecord_ownerDid_idx" ON "NameRecord"("ownerDid");
CREATE INDEX "NameRecord_status_idx" ON "NameRecord"("status");
ALTER TABLE "NameRecord"
  ADD CONSTRAINT "NameRecord_namespace_fkey"
  FOREIGN KEY ("namespace") REFERENCES "Namespace"("name")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- NameStatusChange audit log — names are never hard-deleted; status
-- transitions are the audit history
CREATE TABLE "NameStatusChange" (
  "id" BIGSERIAL PRIMARY KEY,
  "namespace" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "oldStatus" INTEGER NOT NULL,
  "newStatus" INTEGER NOT NULL,
  "changedBy" TEXT NOT NULL,
  "reason" TEXT,
  "height" BIGINT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "NameStatusChange_name_idx"
  ON "NameStatusChange"("namespace", "normalizedName");

-- NameTransfer audit log
CREATE TABLE "NameTransfer" (
  "id" BIGSERIAL PRIMARY KEY,
  "namespace" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "fromOwnerDid" TEXT NOT NULL,
  "toOwnerDid" TEXT NOT NULL,
  "transferredBy" TEXT NOT NULL,
  "height" BIGINT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "NameTransfer_name_idx"
  ON "NameTransfer"("namespace", "normalizedName");
CREATE INDEX "NameTransfer_fromOwnerDid_idx" ON "NameTransfer"("fromOwnerDid");
CREATE INDEX "NameTransfer_toOwnerDid_idx" ON "NameTransfer"("toOwnerDid");

-- ==========================================================================
-- LIQUIDSTAKE v7 MULTI-POOL
-- ==========================================================================
CREATE TABLE "LiquidStakePool" (
  "poolId" TEXT NOT NULL,
  "liquidBondDenom" TEXT NOT NULL,
  "proxyAccountAddress" TEXT NOT NULL,
  "whitelistedValidators" JSONB NOT NULL,
  "unstakeFeeRate" TEXT NOT NULL,
  "feeAccountAddress" TEXT NOT NULL,
  "autocompoundFeeRate" TEXT NOT NULL,
  "whitelistAdminAddress" TEXT NOT NULL,
  "paused" BOOLEAN NOT NULL DEFAULT FALSE,
  "weightedRewardsReceivers" JSONB NOT NULL,
  "createdAtHeight" BIGINT,
  "updatedAtHeight" BIGINT,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "LiquidStakePool_pkey" PRIMARY KEY ("poolId")
);
CREATE UNIQUE INDEX "LiquidStakePool_liquidBondDenom_uniq"
  ON "LiquidStakePool"("liquidBondDenom");

-- Global module params (single-row table — primary key forces single row)
CREATE TABLE "LiquidStakeModuleParams" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "minLiquidStakeAmount" TEXT NOT NULL,
  "modulePaused" BOOLEAN NOT NULL DEFAULT FALSE,
  "updatedAtHeight" BIGINT,
  "updatedAt" TIMESTAMP(3),
  CONSTRAINT "LiquidStakeModuleParams_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LiquidStakeModuleParams_singleton" CHECK ("id" = 1)
);

-- Per-tx stake/unstake event log so dashboards can show pool activity
CREATE TABLE "LiquidStakeTx" (
  "id" BIGSERIAL PRIMARY KEY,
  -- "stake" | "unstake" | "autocompound" | "rebalance" | "addValidator"
  "kind" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "delegator" TEXT,
  -- generic JSONB payload — schema varies per event kind; full event for
  -- audit/replay so we don't lose data if a new field is added later
  "payload" JSONB NOT NULL,
  "transactionHash" TEXT,
  "height" BIGINT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "LiquidStakeTx_poolId_idx" ON "LiquidStakeTx"("poolId");
CREATE INDEX "LiquidStakeTx_delegator_idx" ON "LiquidStakeTx"("delegator");
CREATE INDEX "LiquidStakeTx_kind_idx" ON "LiquidStakeTx"("kind");

-- Down Migration
-- DROP TABLE "LiquidStakeTx";
-- DROP TABLE "LiquidStakeModuleParams";
-- DROP TABLE "LiquidStakePool";
-- DROP TABLE "NameTransfer";
-- DROP TABLE "NameStatusChange";
-- ALTER TABLE "NameRecord" DROP CONSTRAINT "NameRecord_namespace_fkey";
-- DROP TABLE "NameRecord";
-- DROP TABLE "Namespace";
-- DROP TABLE "AgentDepositBalance";
-- DROP TABLE "MemberBudget";
-- DROP TABLE "DisputeResolution";
-- ALTER TABLE "Dispute" DROP COLUMN "status";
-- ALTER TABLE "Dispute" DROP COLUMN "submittedAt";
-- ALTER TABLE "Dispute" DROP COLUMN "disputeDeposit";
-- ALTER TABLE "Dispute" DROP COLUMN "disputerDid";
-- ALTER TABLE "Dispute" DROP COLUMN "disputerAddress";
-- ALTER TABLE "Dispute" DROP COLUMN "targetRole";
-- ALTER TABLE "Dispute" ALTER COLUMN "proof" SET NOT NULL;
-- ALTER TABLE "Dispute" DROP COLUMN "id";
-- DROP INDEX "Claim_currentEvaluationId_idx";
-- ALTER TABLE "Claim" DROP CONSTRAINT "Claim_currentEvaluationId_fkey";
-- ALTER TABLE "Claim" DROP COLUMN "currentEvaluationId";
-- DROP INDEX "Evaluation_agentAddress_idx";
-- DROP INDEX "Evaluation_claimId_evaluationDate_idx";
-- ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_claim_agent_date_uniq";
-- ALTER TABLE "Evaluation" DROP COLUMN "id";
-- ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("claimId");
-- ALTER TABLE "Claim" DROP COLUMN "memberAddress";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "adjudicators";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "minDepositPeriodNs";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "disputesDismissed";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "disputesAwarded";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "disputesOpen";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "penaltyAmountPerDispute";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "disputeDepositAmount";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "evaluatorDepositRequired";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "serviceAgentDepositRequired";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "flaggedActive";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "flagged";
