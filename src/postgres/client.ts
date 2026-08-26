import { Pool, PoolClient } from "pg";
import {
  DATABASE_POOL_MAX,
  DATABASE_QUERY_TIMEOUT_MS,
  DATABASE_URL,
  DATABASE_USE_SSL,
} from "../util/secrets";
import { currentPool } from "../sync/sync_blocks";

export const pool = new Pool({
  application_name: "Blocksync",
  connectionString: DATABASE_URL,
  // maximum number of clients the pool should contain
  // (the cluster's max_connections is shared with every other service;
  // requests queue briefly for a free client instead of stampeding postgres)
  max: DATABASE_POOL_MAX,
  min: 3,
  // number of milliseconds a client must sit idle in the pool and not be checked out
  // before it is disconnected from the backend and discarded
  idleTimeoutMillis: 30000,
  // TCP keepalive so idle clients survive LB/tunnel idle-connection drops
  keepAlive: true,
  // number of milliseconds to wait before timing out when connecting a new client
  // by default this is 0 which means no timeout
  connectionTimeoutMillis: 8000,
  // Client-side per-query timer. keepAlive can't help a query that is
  // already in flight on a dying socket — the kernel retransmits for
  // ~15min before erroring, freezing the sync loop (seen on testnet
  // Aug 25-26 2026: a 582s empty block and a ~15min read-ETIMEDOUT hang).
  // With this, the query rejects, the sync loop's retry path gets a fresh
  // connection, and worst-case lag is bounded by this value.
  ...(DATABASE_QUERY_TIMEOUT_MS > 0 && {
    query_timeout: DATABASE_QUERY_TIMEOUT_MS,
  }),
  ...(DATABASE_USE_SSL && { ssl: { rejectUnauthorized: false } }), // Use SSL (recommended
});

// An errored idle client must never crash the process (idle connections
// dropped by load balancers / tunnels surface here).
pool.on("error", (err) => {
  console.error("ERROR::pgpool::", err.message);
});

// Server-side backstop: after a client abandons a timed-out query, a
// backend blocked on a lock doesn't notice the closed socket and would
// keep waiting (and queueing) — cap it on the server too. Above the
// client-side query_timeout so the client always fails first. Best-effort:
// per-connection SETs are exact on direct/session-pooled connections.
pool.on("connect", (client) => {
  client
    .query("SET statement_timeout = '120s'; SET lock_timeout = '30s'")
    .catch((err) => console.error("ERROR::pgpool set timeouts::", err.message));
});

// helper function that manages connection transaction start and commit and rollback
// on fail, user can just pass a function that takes a client as argument
export const withTransaction = async (
  fn: (client: PoolClient) => Promise<any>,
) => {
  const client = await pool.connect();
  // Set when the CONNECTION itself is unusable (rollback failed — dead or
  // mid-query socket): release(err) makes pg-pool DESTROY the client
  // instead of recycling a poisoned connection. App-level errors whose
  // rollback succeeds keep the healthy connection.
  let connErr: Error | undefined;
  try {
    await client.query("BEGIN");
    const res = await fn(client);
    await client.query("COMMIT");
    return res;
  } catch (error) {
    // ROLLBACK on a dead socket would hang/throw and mask the original
    // error — best-effort only.
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      connErr = rollbackError as Error;
    }
    throw error;
  } finally {
    client.release(connErr);
  }
};

/**
 * Helper function to execute a query either using the global current pool or a new pool connection
 */
export const dbQuery = async (queryText: string, params: any[] = []) => {
  const client = currentPool || pool;
  return await client.query(queryText, params);
};

// helper function that manages connect to pool and release,
// user can just pass a function that takes a client as argument
export const withQuery = async (fn: (client: any) => Promise<any>) => {
  // const start = Date.now();
  const client = await pool.connect();
  try {
    return await fn(client);
  } catch (error) {
    throw error;
  } finally {
    client.release();
    // console.log("executed query", { duration: Date.now() - start });
  }
};
