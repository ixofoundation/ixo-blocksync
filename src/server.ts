require("log-timestamp");
import * as http from "http";
import App from "./app";
import ServerUtils from "./util/server_utils";
import { Chain } from "@prisma/client";
import * as Connection from "./util/connection";
import * as StatsHandler from "./handlers/stats_handler";
import * as ChainHandler from "./handlers/chain_handler";
import * as SyncBlocks from "./sync/sync_blocks";
import {
    PORT,
    RPC,
    REST,
    BONDS_INFO_EXTRACT_PERIOD_BLOCKS,
} from "./util/secrets";

export let statId: number;
const seedStats = async () => {
    const existingStats = await StatsHandler.getStats();
    if (existingStats) {
        statId = existingStats?.id;
    } else {
        const newStats = await StatsHandler.createStats();
        statId = newStats?.id;
    }
};
seedStats();

export let currentChain: Chain;
const seedChain = async () => {
    const existingChain = await ChainHandler.getChain();
    if (existingChain) {
        currentChain = existingChain;
    } else {
        const res = await Connection.getLastBlock();
        const newChain = await ChainHandler.createChain({
            chainId: res.header.chain_id,
            blockHeight: 1,
        });
        currentChain = newChain;
    }
};
seedChain();

const port = PORT;
const chainUri = RPC;
const bcRest = REST;
const bondsInfoExtractPeriod = BONDS_INFO_EXTRACT_PERIOD_BLOCKS;

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

Connection.testConnection();
SyncBlocks.startSync();
