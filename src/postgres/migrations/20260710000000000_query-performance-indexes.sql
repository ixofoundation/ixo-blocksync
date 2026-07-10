-- Up Migration

-- Query-performance indexes for the public GraphQL/REST API, verified July
-- 2026 against a mainnet copy (measurements in the ixo-blocksync-api repo,
-- docs/verification-2026-07.md).

-- Wallet transaction pollers filter Message on "from" / "to" independently
-- (or: [{from: {equalTo}}, {to: {equalTo}}]). The existing composite index
-- leads with "transactionHash", so those filters were sequential scans:
-- ~130ms per request on ~1M rows, ~4ms with these partial indexes.
CREATE INDEX IF NOT EXISTS "Message_from_idx"
  ON "Message"("from") WHERE "from" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Message_to_idx"
  ON "Message"("to") WHERE "to" IS NOT NULL;

-- typeUrl is filtered with equalTo / in and exact-string LIKE by clients.
-- text_pattern_ops serves both equality and LIKE prefix matching under the
-- cluster's en_US.utf-8 collation (a default-collation btree would only
-- serve equality).
CREATE INDEX IF NOT EXISTS "Message_typeUrl_idx"
  ON "Message"("typeUrl" text_pattern_ops);

-- getAccountTokens(allEntityRetired: true) sums TokenRetired amounts grouped
-- by token id ("id" = ANY(...)). The existing (name, owner, id) composite
-- cannot serve id-only lookups.
CREATE INDEX IF NOT EXISTS "TokenRetired_id_idx" ON "TokenRetired"("id");

-- Collection claim lists paginate ordered by (submissionDate, claimId) within
-- a collection (REST /api/claims/collection/:id/claims and the GraphQL
-- SUBMISSION_DATE_* orderBys).
CREATE INDEX IF NOT EXISTS "Claim_collectionId_submissionDate_idx"
  ON "Claim"("collectionId", "submissionDate" DESC, "claimId");

-- Down Migration

DROP INDEX IF EXISTS "Claim_collectionId_submissionDate_idx";
DROP INDEX IF EXISTS "TokenRetired_id_idx";
DROP INDEX IF EXISTS "Message_typeUrl_idx";
DROP INDEX IF EXISTS "Message_to_idx";
DROP INDEX IF EXISTS "Message_from_idx";
