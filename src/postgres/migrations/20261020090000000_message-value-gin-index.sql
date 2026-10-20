-- Up Migration

-- JSONB containment lookups on Message.value: "every message that mentions
-- this object", e.g. value @> '{"id": "<did>"}', '{"entity": "<did>"}',
-- '{"collectionId": "<id>"}' or '{"msgs": [{"id": "<did>"}]}' for messages
-- wrapped in an authz MsgExec. Without an index each one is a sequential scan
-- of the whole table (mainnet: 1.35M rows, 7.8 GB with TOAST, well past the
-- API's statement timeout; devnet: 4 s). This is what forced IXO Trace to
-- prebuild its own index and to lean on the chain node's tx_search, which
-- took the public RPC down on 2026-10-19 (IXO-5671).
--
-- jsonb_path_ops rather than the default opclass: it only serves the @>
-- operator (PostGraphile's `contains` filter), but the index is several
-- times smaller and faster to build, and Message.value is the largest JSONB
-- column in the database. containsKey/containsAllKeys on Message.value stay
-- unindexed; no client uses them.
--
-- Operational note: migrations run at indexer startup, before the health
-- port opens, and the liveness probe allows ~35 s. On an existing large
-- environment build the index by hand first, so this statement is a no-op:
--   SET maintenance_work_mem = '512MB';
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_value_gin_idx"
--     ON "Message" USING gin ("value" jsonb_path_ops);
CREATE INDEX IF NOT EXISTS "Message_value_gin_idx"
  ON "Message" USING gin ("value" jsonb_path_ops);

-- Down Migration

DROP INDEX IF EXISTS "Message_value_gin_idx";
