"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = require("dotenv");
var fs = require("fs");
var logger_1 = require("./logger");
if (fs.existsSync('.env')) {
    logger_1.default.debug('Using .env file to supply config environment variables');
    dotenv.config({ path: '.env' });
}
else {
    logger_1.default.debug('Using .env-example file to supply config environment variables');
    dotenv.config({ path: '.env-example' }); // you can delete this after you create your own .env file!
}
exports.ENVIRONMENT = process.env.NODE_ENV;
var prod = exports.ENVIRONMENT === 'production'; // Anything else is treated as 'dev'
exports.MONGODB_URI = prod ? process.env['MONGODB_URI'] : process.env['MONGODB_URI_LOCAL'];
if (!exports.MONGODB_URI) {
    logger_1.default.error('No mongo connection string. Set MONGODB_URI environment variable.');
    process.exit(1);
}
//# sourceMappingURL=secrets.js.map