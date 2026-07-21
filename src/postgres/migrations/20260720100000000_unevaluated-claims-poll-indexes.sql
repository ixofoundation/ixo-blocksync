-- Up Migration

-- The subscriptions service polls every few seconds for unevaluated claims
-- on the claim collections it administers (scoped by the collection's
-- protocol DID):
--
--   claims(filter: {
--     currentEvaluationId: { isNull: true },
--     collection: { protocol: { equalTo: $oracleProtocolDid } }
--   }, orderBy: [SUBMISSION_DATE_ASC], first: N)
--
-- "currentEvaluationId IS NULL" alone is NOT selective (mainnet July 2026:
-- ~34k unevaluated of ~226k claims, mostly other protocols' history), so the
-- plan must be driven from the collection side: resolve collections by
-- protocol, then probe per collection for its unevaluated claims. The
-- partial index below contains ONLY unevaluated claims, keyed exactly for
-- that probe (+ the submissionDate order the poller asks for), and shrinks
-- as claims get evaluated. The existing full indexes on Claim can't serve
-- this cheaply: "Claim_collectionId_submissionDate_idx" scans evaluated
-- history too, and "Claim_currentEvaluationId_idx" returns the whole
-- chain-wide unevaluated set with no collection discrimination.
CREATE INDEX IF NOT EXISTS "Claim_unevaluated_by_collection_idx"
  ON "Claim"("collectionId", "submissionDate")
  WHERE "currentEvaluationId" IS NULL;

-- Collections are looked up by protocol DID (the poller's scope filter, and
-- a natural filter for any "all collections of protocol X" query).
CREATE INDEX IF NOT EXISTS "ClaimCollection_protocol_idx"
  ON "ClaimCollection"("protocol");

-- Down Migration

DROP INDEX IF EXISTS "ClaimCollection_protocol_idx";
DROP INDEX IF EXISTS "Claim_unevaluated_by_collection_idx";
