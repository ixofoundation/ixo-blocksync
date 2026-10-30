-- Up Migration

-- Remove /ibc.core.client.v1.MsgUpdateClient messages from "Message".
--
-- They are IBC light-client headers (validator sets and signatures, ~100 kB
-- each): on mainnet 63,602 rows and 6.1 GB, 86% of the table's bytes
-- (2026-10-30), and nobody queries them. The indexer no longer writes them
-- (SKIPPED_MESSAGE_TYPE_URLS in src/sync_handlers/transaction_sync.ts); the raw
-- messages stay in blocksync-core ("MessageCore") and on chain.
--
-- With them gone, the next migration replaces the partial GIN index
-- "Message_value_nonibc_gin_idx" (which needed every containment query to add
-- `typeUrl <> MsgUpdateClient`) with an ordinary one.
--
-- Runs in its own transaction and must COMMIT before the index is built:
-- the next migration's CREATE INDEX CONCURRENTLY then indexes only live rows.
--
-- Cost on an existing environment: a few minutes on mainnet. The indexer's
-- health endpoint answers during migrations and sync starts only after them,
-- so this is safe at startup (src/index.ts). On a fresh database both
-- statements touch no rows.

-- Their signer rows first (TransactionSigner has no FK to Message; join on the
-- message's position in its transaction).
DELETE FROM "TransactionSigner" AS s
USING "Message" AS m
WHERE m."typeUrl" = '/ibc.core.client.v1.MsgUpdateClient'
  AND s."transactionId" = m."transactionId"
  AND s."messageIndex" = m."index";

DELETE FROM "Message"
WHERE "typeUrl" = '/ibc.core.client.v1.MsgUpdateClient';

-- Down Migration

-- Irreversible here: the rows are gone. To restore them, re-index from
-- blocksync-core with a build that no longer skips the type.
