import * as fs from "fs";
import * as dotenv from "dotenv";
import logger from "./logger";

if (fs.existsSync(".env")) {
    logger.debug("Using .env file to supply config environment variables");
    dotenv.config({ path: ".env" });
} else {
    logger.debug(
        "Using .env-example file to supply config environment variables",
    );
    dotenv.config({ path: ".env-example" });
}

export const PORT = process.env.PORT || 8080;
export const ENVIRONMENT = process.env.NODE_ENV;
export const SENTRYDSN = process.env.SENTRYDSN
    ? process.env.SENTRYDSN
    : undefined;
export const RPC = process.env.CHAIN_URI || "http://localhost:26657";
export const REST = process.env.BC_REST || "http://localhost:1317";
export const IGNORE_EVENTS = process.env.IGNORE_EVENTS
    ? process.env.IGNORE_EVENTS.split(",")
    : undefined;
export const ONLY_EVENTS = process.env.ONLY_EVENTS
    ? process.env.ONLY_EVENTS.split(",")
    : undefined;
export const BONDS_INFO_EXTRACT_PERIOD_BLOCKS = process.env
    .BONDS_INFO_EXTRACT_PERIOD_BLOCKS
    ? parseInt(process.env.BONDS_INFO_EXTRACT_PERIOD_BLOCKS)
    : undefined;
export const DATABASE_URL = process.env.DATABASE_URL;
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = process.env.REDIS_PORT;

logger.info("Ignoring Events: " + IGNORE_EVENTS);
logger.info("Only Events: " + ONLY_EVENTS);
logger.info(
    "Bonds Info Extract Period Blocks: " + BONDS_INFO_EXTRACT_PERIOD_BLOCKS,
);
