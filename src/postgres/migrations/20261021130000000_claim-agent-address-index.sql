-- Up Migration

-- Claim."agentAddress" has no index. The question "how many claims did this
-- address submit" (`claims(condition: { agentAddress })` totalCount, asked by
-- Trace's labels and Portal profiles) therefore compiles to
--   select count(*) from "Claim" where "agentAddress" = $1
-- and runs as a parallel sequential scan of the whole table: on mainnet
-- 2026-10-21 it was the single most expensive Blocksync statement —
-- 1.2M calls at 150 ms mean, about 50 hours of database time in
-- pg_stat_statements — for ~1,050 distinct addresses. A plain btree turns it
-- into an index-only range count.
--
-- Same operational rule as the submissionDate index above: migrations run at
-- indexer startup inside the ~35 s liveness window, so on an existing
-- environment build it by hand first and let this statement be a no-op:
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "Claim_agentAddress_idx"
--     ON "Claim"("agentAddress");
--   SELECT indisvalid FROM pg_index
--     WHERE indexrelid = '"Claim_agentAddress_idx"'::regclass;  -- must be true
CREATE INDEX IF NOT EXISTS "Claim_agentAddress_idx"
  ON "Claim"("agentAddress");

-- Down Migration

DROP INDEX IF EXISTS "Claim_agentAddress_idx";
