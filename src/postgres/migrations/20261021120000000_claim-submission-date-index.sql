-- Up Migration

-- The chain-wide claims feed: evaluation oracles read only the claims that
-- are new since their watermark, instead of polling every collection they
-- watch one by one:
--
--   claims(orderBy: SUBMISSION_DATE_ASC, after: $cursor,
--     filter: { submissionDate: { greaterThanOrEqualTo: $watermark } },
--     first: N)
--
-- No existing Claim index leads with "submissionDate" ("Claim_pkey",
-- "Claim_collectionId_idx", "Claim_collectionId_submissionDate_idx",
-- "Claim_memberAddress_idx", "Claim_currentEvaluationId_idx" and the
-- partial "Claim_unevaluated_by_collection_idx" /
-- "Claim_collectionId_schemaType_null_idx"), so without this index every
-- poll sorts the whole table. "claimId" matches PostGraphile's primary-key
-- tiebreak in the cursor order, so the feed is a keyset read with a strict
-- LIMIT and no OFFSET. "submissionDate" only grows, so inserts append at the
-- right edge of the btree (cheap).
--
-- Operational note: migrations run at indexer startup, before the health
-- port opens, and the liveness probe allows ~35 s. On an existing large
-- environment build the index by hand first, so this statement is a no-op:
--   SET maintenance_work_mem = '512MB';
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "Claim_submissionDate_claimId_idx"
--     ON "Claim"("submissionDate", "claimId");
-- then confirm it is valid before deploying:
--   SELECT indisvalid FROM pg_index
--     WHERE indexrelid = '"Claim_submissionDate_claimId_idx"'::regclass;
CREATE INDEX IF NOT EXISTS "Claim_submissionDate_claimId_idx"
  ON "Claim"("submissionDate", "claimId");

-- Down Migration

DROP INDEX IF EXISTS "Claim_submissionDate_claimId_idx";
