import * as fs from "fs";
import * as dotenv from "dotenv";
import logger from "./logger";

if (fs.existsSync(".env")) {
    logger.debug("Using .env");
    dotenv.config({ path: ".env" });
} else {
    logger.debug("Using .env-example");
    dotenv.config({ path: ".env-example" });
}

export const PORT = Number(process.env.PORT) || 8080;
export const ENVIRONMENT = process.env.NODE_ENV;
export const SENTRYDSN = process.env.SENTRYDSN
    ? process.env.SENTRYDSN
    : undefined;
export const RPC = process.env.RPC || "http://localhost:26657";
export const REST = process.env.REST || "http://localhost:1317";
export const DATABASE_URL = process.env.DATABASE_URL;
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = process.env.REDIS_PORT;
