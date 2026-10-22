-- Up Migration

-- Eight indexes found by reading pg_stat_statements on the mainnet master
-- (counters since 2026-10-02) and EXPLAIN (ANALYZE, BUFFERS) of each shape
-- with real values, 2026-10-22. Every one replaces a Seq Scan, or a primary-key
-- scan with a filter, that PostGraphile's generated SQL ran on every call.
-- Details, before/after numbers and evidence: Linear IXO-5744.
--
-- Same operational rule as the Claim indexes above: migrations run at indexer
-- startup inside the ~35 s liveness window, so on an existing environment build
-- each index by hand first with CREATE INDEX CONCURRENTLY IF NOT EXISTS, check
-- indisvalid, and let the statements below be no-ops. That was done on devnet,
-- testnet and mainnet blocksync_alt before this migration shipped.

-- Token reads. Every Token row fetches its balances, transactions and retirements
-- by "tokenId". TokenBalance only had the (address, tokenId) primary key and
-- TokenTransaction had no tokenId index at all, so each token cost a full scan
-- of both tables: token-by-id 320k calls at 165 ms mean, and the name+index page
-- (`tokens(filter: {name, index: {like}})`) 6.1 s mean, ~10 GB of buffers a call.
CREATE INDEX IF NOT EXISTS "TokenBalance_tokenId_address_idx"
  ON "TokenBalance" ("tokenId", "address");
CREATE INDEX IF NOT EXISTS "TokenTransaction_tokenId_aid_idx"
  ON "TokenTransaction" ("tokenId", "aid");

-- tokens(filter: {name}, orderBy: INDEX_ASC) sorted all 121k CARBON rows per page.
CREATE INDEX IF NOT EXISTS "Token_name_index_id_idx"
  ON "Token" ("name", "index", "id");

-- iids(filter: {controller: {contains: [...]}}) and its totalCount: 1.3M calls,
-- 125 ms mean, the largest total on the cluster (136k s). text[] containment.
CREATE INDEX IF NOT EXISTS "IID_controller_gin_idx"
  ON "IID" USING gin ("controller");

-- entities(filter: {accounts: {contains: [{address}]}}): 1.5M calls, Seq Scan.
-- jsonb_path_ops serves @> only, which is the only operator the API emits here.
CREATE INDEX IF NOT EXISTS "Entity_accounts_gin_idx"
  ON "Entity" USING gin ("accounts" jsonb_path_ops);

-- claimCollections(condition: {admin}) and its totalCount: 1.5M calls, Seq Scan.
CREATE INDEX IF NOT EXISTS "ClaimCollection_admin_idx"
  ON "ClaimCollection" ("admin");

-- evaluations(filter: {collectionId, evaluationDate: {greaterThan}},
-- orderBy: EVALUATION_DATE_DESC): 600k calls, Parallel Seq Scan of the table.
CREATE INDEX IF NOT EXISTS "Evaluation_collectionId_evaluationDate_id_idx"
  ON "Evaluation" ("collectionId", "evaluationDate", "id");

-- transactions(filter: {time range, code}) totalCount: 50k calls, Seq Scan.
-- The paged variant (order by id limit N) still prefers the primary key scan
-- for recent ranges; see IXO-5744.
CREATE INDEX IF NOT EXISTS "Transaction_time_idx"
  ON "Transaction" ("time");

-- Down Migration

DROP INDEX IF EXISTS "Transaction_time_idx";
DROP INDEX IF EXISTS "Evaluation_collectionId_evaluationDate_id_idx";
DROP INDEX IF EXISTS "ClaimCollection_admin_idx";
DROP INDEX IF EXISTS "Entity_accounts_gin_idx";
DROP INDEX IF EXISTS "IID_controller_gin_idx";
DROP INDEX IF EXISTS "Token_name_index_id_idx";
DROP INDEX IF EXISTS "TokenTransaction_tokenId_aid_idx";
DROP INDEX IF EXISTS "TokenBalance_tokenId_address_idx";
