export const PORT = Number(process.env.PORT) || 8080;
export const SENTRYDSN = process.env.SENTRYDSN || undefined;
export const RPC = process.env.RPC || "http://localhost:26657";
export const IXO_ARCHIVE_NODE_REST_API =
  process.env.IXO_ARCHIVE_NODE_REST_API || "http://localhost:1317";
export const DATABASE_URL = process.env.DATABASE_URL;
export const DATABASE_URL_CORE = process.env.DATABASE_URL_CORE;
export const MIGRATE_DB_PROGRAMATICALLY =
  Number(process.env.MIGRATE_DB_PROGRAMATICALLY ?? "0") || 0;
export const TRUST_PROXY = process.env.TRUST_PROXY || 1;
export const ENTITY_MODULE_CONTRACT_ADDRESS =
  process.env.ENTITY_MODULE_CONTRACT_ADDRESS || "";
export const DATABASE_USE_SSL =
  Number(process.env.DATABASE_USE_SSL ?? "0") || 0;
export const STATIC_CHAIN_ID = process.env.STATIC_CHAIN_ID;
export const NETWORK = process.env.NETWORK || "devnet";

// Max clients for the shared app/sync pg pool. The cluster's max_connections
// is shared by every service, and a pg connection is a whole backend process;
// small pools that queue briefly under load outperform large ones that
// stampede the database.
// Interim (until chain v9 emits authz-update events, IXO-4233): refresh a
// grant's stored constraints from the archive LCD when claim events show it
// was consumed. 0 disables; the index then keeps as-granted constraints
// (existence/exhaustion/expiry stay event-accurate regardless).
export const AUTHZ_CONSTRAINT_REFRESH =
  Number(process.env.AUTHZ_CONSTRAINT_REFRESH ?? "1") || 0;

export const DATABASE_POOL_MAX =
  Number(process.env.DATABASE_POOL_MAX ?? "20") || 20;

// log blocks whose fetch+index time exceeds this many milliseconds (0 disables)
export const SLOW_BLOCK_LOG_MS = Number(process.env.SLOW_BLOCK_LOG_MS ?? "8000");
