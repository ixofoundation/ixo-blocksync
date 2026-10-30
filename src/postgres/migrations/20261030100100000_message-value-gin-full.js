/* eslint-disable */
// Replace the partial GIN index on "Message".value with an ordinary one.
//
// The partial index "Message_value_nonibc_gin_idx" excluded
// /ibc.core.client.v1.MsgUpdateClient, so Postgres used it only when a query
// also said `"typeUrl" <> '/ibc.core.client.v1.MsgUpdateClient'` (and only with
// custom plans). The previous migration removed those rows and the indexer no
// longer writes them, so a full index costs the same (~1 GB on mainnet) and
// every `value: { contains: … }` query can use it as written.
//
// This is a JavaScript migration because it must run OUTSIDE a transaction:
// - CREATE INDEX CONCURRENTLY builds from an MVCC snapshot, so the rows the
//   previous migration deleted are not indexed (a plain CREATE INDEX would also
//   index recently-deleted rows, ~6 GB on mainnet), and it never blocks
//   readers or writers.
// - DROP INDEX CONCURRENTLY drops the old index without an ACCESS EXCLUSIVE
//   lock on "Message", so API reads are never blocked.
// node-pg-migrate commits the pending migrations before running this one.
//
// Idempotent: an INVALID leftover from an interrupted concurrent build is
// dropped and rebuilt; everything else uses IF [NOT] EXISTS. On a fresh
// database it completes instantly.

const NEW_INDEX = "Message_value_gin_idx";
const OLD_INDEX = "Message_value_nonibc_gin_idx";

const isInvalid = async (pgm, name) => {
  const rows = await pgm.db.select(
    `SELECT NOT i.indisvalid AS invalid
       FROM pg_index i
       JOIN pg_class c ON c.oid = i.indexrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = '${name}'`
  );
  return rows.length > 0 && rows[0].invalid === true;
};

exports.up = async (pgm) => {
  pgm.noTransaction();

  if (await isInvalid(pgm, NEW_INDEX)) {
    pgm.sql(`DROP INDEX CONCURRENTLY IF EXISTS "${NEW_INDEX}";`);
  }
  // No `SET maintenance_work_mem` here: the indexer connects through pgbouncer
  // in transaction mode, so a session SET outside a transaction would leak onto
  // a pooled server connection. The build uses the server default; it is
  // slower, but it neither blocks the API nor the (paused) indexer.
  pgm.sql(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${NEW_INDEX}" ON "Message" USING gin (value jsonb_path_ops);`
  );
  pgm.sql(`DROP INDEX CONCURRENTLY IF EXISTS "${OLD_INDEX}";`);
};

exports.down = async (pgm) => {
  pgm.noTransaction();

  if (await isInvalid(pgm, OLD_INDEX)) {
    pgm.sql(`DROP INDEX CONCURRENTLY IF EXISTS "${OLD_INDEX}";`);
  }
  pgm.sql(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${OLD_INDEX}" ON "Message" USING gin (value jsonb_path_ops) WHERE "typeUrl" <> '/ibc.core.client.v1.MsgUpdateClient';`
  );
  pgm.sql(`DROP INDEX CONCURRENTLY IF EXISTS "${NEW_INDEX}";`);
};
