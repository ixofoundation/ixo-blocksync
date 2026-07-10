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
export const IPFS_SERVICE_MAPPING = process.env.IPFS_SERVICE_MAPPING || "";
export const DATABASE_USE_SSL =
  Number(process.env.DATABASE_USE_SSL ?? "0") || 0;
export const STATIC_CHAIN_ID = process.env.STATIC_CHAIN_ID;
export const NETWORK = process.env.NETWORK || "devnet";

// Max clients for the shared app/sync pg pool. The cluster's max_connections
// is shared by every service, and a pg connection is a whole backend process;
// small pools that queue briefly under load outperform large ones that
// stampede the database.
export const DATABASE_POOL_MAX =
  Number(process.env.DATABASE_POOL_MAX ?? "20") || 20;
// Max clients for Postgraphile's GraphQL pool.
export const GRAPHQL_POOL_MAX =
  Number(process.env.GRAPHQL_POOL_MAX ?? "30") || 30;

// Fraction of requests Sentry traces (1.0 traced every request in prod,
// which adds per-request overhead and quota burn).
const sentryRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE);
export const SENTRY_TRACES_SAMPLE_RATE = Number.isFinite(sentryRate)
  ? sentryRate
  : 0.1;
