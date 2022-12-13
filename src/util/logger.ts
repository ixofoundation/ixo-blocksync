const winston = require("winston");
import * as expressWinston from "express-winston";

const beforeLogger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: process.env.NODE_ENV === "production" ? "error" : "debug",
        }),
        new winston.transports.File({ filename: "before.log", level: "debug" }),
    ],
});

const afterLogger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: process.env.NODE_ENV === "production" ? "error" : "debug",
        }),
        new winston.transports.File({ filename: "after.log", level: "debug" }),
    ],
});

export let before = expressWinston.logger({
    winstonInstance: beforeLogger,
});

export let after = expressWinston.errorLogger({
    winstonInstance: afterLogger,
});

const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: process.env.NODE_ENV === "production" ? "error" : "debug",
        }),
        new winston.transports.File({ filename: "debug.log", level: "debug" }),
    ],
});

if (process.env.NODE_ENV !== "production") {
    logger.debug("Logging at Debug Level");
}

export default logger;
