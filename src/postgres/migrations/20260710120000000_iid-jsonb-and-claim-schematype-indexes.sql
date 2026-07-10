-- Up Migration

-- Follow-up to 20260710000000000_query-performance-indexes: indexes found by
-- profiling the custom resolver SQL against a mainnet copy.

-- JSONB containment lookups on IID. Clients resolve entities by class
-- (context @> [{key:'class', val:<did>}] - collection listings and the
-- getTokensTotalForCollection* fan-out) and offers/KYC by linked collection
-- (linkedEntity @> [{type:'ClaimCollection', id:<id>}]); both were full
-- jsonb scans of the IID table (52ms / 9ms -> ~4ms / ~0.1ms). Default GIN
-- opclass so the API's containsKey/containsAllKeys filters are also served.
CREATE INDEX IF NOT EXISTS "IID_context_gin_idx"
  ON "IID" USING gin ("context");
CREATE INDEX IF NOT EXISTS "IID_linkedEntity_gin_idx"
  ON "IID" USING gin ("linkedEntity");

-- ClaimCollection.claimSchemaTypesLoaded checks for claims with a NULL
-- schemaType inside a collection; on large collections the planner fell back
-- to scanning every claim (~43ms on a 113k-claim collection). This partial
-- index only ever contains the not-yet-typed claims (normally none), making
-- the check an index-only scan (~0.05ms). Also serves the schema-type cron's
-- per-collection lookups.
CREATE INDEX IF NOT EXISTS "Claim_collectionId_schemaType_null_idx"
  ON "Claim"("collectionId") WHERE "schemaType" IS NULL;

-- Down Migration

DROP INDEX IF EXISTS "Claim_collectionId_schemaType_null_idx";
DROP INDEX IF EXISTS "IID_linkedEntity_gin_idx";
DROP INDEX IF EXISTS "IID_context_gin_idx";
