"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
var http = require("http");
var app_1 = require("./app");
var mongo_utils_1 = require("./db/mongo_utils");
var sync_blocks_1 = require("./util/sync_blocks");
// Set the port
var port = (process.env.PORT || 8080);
app_1.default.set('port', port);
var server = http.createServer(app_1.default);
var mongoDB = new mongo_utils_1.default(server, Number(port));
mongoDB.connectToDb();
var syncBlocks = new sync_blocks_1.SyncBlocks();
syncBlocks.startSync(process.env.CHAIN_URI || 'localhost:46657');
//# sourceMappingURL=server.js.map