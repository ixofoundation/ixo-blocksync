-- Up Migration

-- Every time this indexer stores is UTC, but the columns were TIMESTAMP(3)
-- (no zone), so the API returned "2026-11-10T05:16:47.319" with no zone and
-- browsers read it as local time: a proposal made a minute ago showed as
-- "8h ago" in Singapore. TIMESTAMPTZ(3) stores the same instants and the API
-- returns them as "2026-11-10T05:16:47.319+00:00".
--
-- This file: "Claim", one of the three large tables, in its own migration so
-- each is locked only for its own rewrite.
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

ALTER TABLE "Claim"
  ALTER COLUMN "submissionDate" TYPE TIMESTAMPTZ(3) USING "submissionDate" AT TIME ZONE 'UTC';

ANALYZE "Claim" ("submissionDate");

-- Down Migration

ALTER TABLE "Claim"
  ALTER COLUMN "submissionDate" TYPE TIMESTAMP(3) USING "submissionDate" AT TIME ZONE 'UTC';

ANALYZE "Claim" ("submissionDate");
