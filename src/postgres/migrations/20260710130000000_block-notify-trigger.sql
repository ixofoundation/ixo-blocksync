-- Up Migration

-- Emit a NOTIFY whenever a block finishes indexing. The sync loop updates
-- "Chain"."blockHeight" inside every per-block transaction, so this trigger
-- fires exactly once per indexed block, at commit, i.e. the exact moment new
-- chain data becomes visible to readers.
--
-- Consumed by ixo-blocksync-api's block-aware response cache (LISTEN
-- blocksync_new_block -> flush), which makes cached responses impossible to
-- be staler than the database. Harmless without listeners; NOTIFY on a
-- channel nobody LISTENs to is a no-op.
CREATE OR REPLACE FUNCTION notify_blocksync_new_block() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('blocksync_new_block', NEW."blockHeight"::text);
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blocksync_new_block_trigger ON "Chain";
CREATE TRIGGER blocksync_new_block_trigger
AFTER INSERT OR UPDATE ON "Chain"
FOR EACH ROW EXECUTE FUNCTION notify_blocksync_new_block();

-- Down Migration

DROP TRIGGER IF EXISTS blocksync_new_block_trigger ON "Chain";
DROP FUNCTION IF EXISTS notify_blocksync_new_block();
