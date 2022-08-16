require('dotenv').config();
require("log-timestamp");
import * as http from "http";
import App from "./app";
import { SyncBlocks } from "./sync_blocks";
import { prisma } from "./prisma_client";
import { createStats } from "./handlers/stats_handler";
import ServerUtils from "./server_utils";

let statId: number;
const seedStats = async () => {
    const existingStats = await prisma.stat.findFirst({});
    if (existingStats) {
        statId = existingStats?.id;
    } else {
        const newStats = await createStats();
        statId = newStats?.id;
    }
};
seedStats();
export { statId };

const port = (process.env.PORT || 8080);
const chainUri = (process.env.CHAIN_URI || "http://localhost:26657");
const bcRest = (process.env.BC_REST || "http://localhost:1317");
const bondsInfoExtractPeriod = process.env.BONDS_INFO_EXTRACT_PERIOD_BLOCKS ?
    parseInt(process.env.BONDS_INFO_EXTRACT_PERIOD_BLOCKS) : undefined

App.set("port", port);
App.set("chainUri", chainUri);
App.set("bcRest", bcRest);
App.set("bondsInfoExtractPeriod", bondsInfoExtractPeriod);
const server = http.createServer(App);
export var io = require("socket.io")(server);

io.on("connection", function (socket) {
    io.emit("success", "app to explorer connected");
});

let serverUtils = new ServerUtils(server, Number(port));
serverUtils.connect();

let syncBlocks = new SyncBlocks();
syncBlocks.startSync(chainUri, bcRest, bondsInfoExtractPeriod);