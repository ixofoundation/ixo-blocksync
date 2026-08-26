import { Pool } from "pg";
import {
  DATABASE_QUERY_TIMEOUT_MS,
  DATABASE_USE_SSL,
} from "../../util/secrets";

export const corePool = new Pool({
  application_name: "Blocksync",
  connectionString: process.env.DATABASE_URL_CORE,
  // maximum number of clients the pool should contain
  // by default this is set to 10.
  // max: 20,
  // number of milliseconds a client must sit idle in the pool and not be checked out
  // before it is disconnected from the backend and discarded
  // default is 10000 (10 seconds) - set to 0 to disable auto-disconnection of idle clients
  idleTimeoutMillis: 10000,
  // TCP keepalive so idle clients survive LB/tunnel idle-connection drops
  keepAlive: true,
  // number of milliseconds to wait before timing out when connecting a new client
  // by default this is 0 which means no timeout
  connectionTimeoutMillis: 1000,
  // Client-side per-query timer — a mid-query dead socket otherwise stalls
  // the sync loop for the ~15min OS retransmission timeout (see client.ts).
  ...(DATABASE_QUERY_TIMEOUT_MS > 0 && {
    query_timeout: DATABASE_QUERY_TIMEOUT_MS,
  }),
  ...(DATABASE_USE_SSL && { ssl: { rejectUnauthorized: false } }), // Use SSL (recommended
});

// An errored idle client must never crash the process.
corePool.on("error", (err) => {
  console.error("ERROR::corePgPool::", err.message);
});

// helper function that manages connect to pool and release,
// user can just pass a function that takes a client as argument
export const withCoreQuery = async (fn: (client: any) => Promise<any>) => {
  // const start = Date.now();
  const client = await corePool.connect();
  try {
    const res = await fn(client);
    client.release();
    return res;
  } catch (error) {
    // Destroy the client rather than recycle it — after a query timeout the
    // socket may still be mid-flight on the abandoned response. These are
    // simple reads, so the reconnect churn on rare errors is negligible.
    client.release(error as Error);
    throw error;
    // console.log("executed query", { duration: Date.now() - start });
  }
};
