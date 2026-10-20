-- Up Migration

-- Replaces 20261020090000000_message-value-gin-index with a partial index.
--
-- Measured on mainnet (2026-10-20): 62,975 /ibc.core.client.v1.MsgUpdateClient
-- rows hold 86% of all Message.value bytes (6.1 GB of 7 GB stored, ~100 kB
-- each): IBC light-client headers, i.e. validator sets and signatures of the
-- counterparty chain. Nothing in them is ever looked up by containment, and a
-- GIN index comes out at roughly 4x the stored size, so indexing them too
-- would cost ~29 GB and an 80-minute build for no query anyone runs. Skipping
-- that one type brings the index to ~4 GB. Every other message type, IBC
-- transfers, packets and acknowledgements included, is fully indexed, and the
-- header rows themselves stay stored and queryable by typeUrl/height/sender.
--
-- The index has a new name on purpose: an environment that pre-built it by
-- hand (CREATE INDEX CONCURRENTLY, see README "Database migrations and
-- indexes") must never have it dropped and rebuilt inside the startup
-- migration, whose liveness window is ~35 s.
--
-- Planner rule: a partial index is used only when the query's WHERE implies
-- the index predicate. Queries that want the fast path must carry
--   "typeUrl" <> '/ibc.core.client.v1.MsgUpdateClient'
-- i.e. in ixo-blocksync-api GraphQL:
--   messages(filter: { typeUrl: { notEqualTo: "/ibc.core.client.v1.MsgUpdateClient" },
--                      value: { contains: { id: "<did>" } } })
-- Without that clause the query is a sequential scan of the whole table.
DROP INDEX IF EXISTS "Message_value_gin_idx";
CREATE INDEX IF NOT EXISTS "Message_value_nonibc_gin_idx"
  ON "Message" USING gin ("value" jsonb_path_ops)
  WHERE "typeUrl" <> '/ibc.core.client.v1.MsgUpdateClient';

-- Down Migration

DROP INDEX IF EXISTS "Message_value_nonibc_gin_idx";
CREATE INDEX IF NOT EXISTS "Message_value_gin_idx"
  ON "Message" USING gin ("value" jsonb_path_ops);
