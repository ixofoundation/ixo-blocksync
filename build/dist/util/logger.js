"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var winston = require("winston");
var expressWinston = require("express-winston");
var winston_1 = require("winston");
exports.before = expressWinston.logger({
    winstonInstance: winston
});
exports.after = expressWinston.errorLogger({
    winstonInstance: winston
});
var logger = new (winston_1.Logger)({
    transports: [
        new (winston.transports.Console)({ level: process.env.NODE_ENV === 'production' ? 'error' : 'debug' }),
        new (winston.transports.File)({ filename: 'debug.log', level: 'debug' })
    ]
});
if (process.env.NODE_ENV !== 'production') {
    logger.debug('Logging initialized at debug level');
}
exports.default = logger;
//# sourceMappingURL=logger.js.map