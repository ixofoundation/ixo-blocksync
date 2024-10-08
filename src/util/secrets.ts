export const PORT = Number(process.env.PORT) || 8080;
export const SENTRYDSN = process.env.SENTRYDSN || undefined;
export const RPC = process.env.RPC || "http://localhost:26657";
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
