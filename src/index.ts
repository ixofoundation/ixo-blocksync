require("log-timestamp");

import { app } from "./app";
import http from "http";
import { Server } from "socket.io";
import { Chain } from "@prisma/client";
import * as Proto from "./util/proto";
import * as ChainHandler from "./handlers/chain_handler";
import * as SyncBlocks from "./sync/sync_blocks";
import { PORT } from "./util/secrets";

export let currentChain: Chain;
const seedChain = async () => {
    const res = await Proto.getLatestBlock();
    const existingChain = await ChainHandler.getChain();
    if (res?.block?.header?.chainId) {
        if (res.block.header.chainId === existingChain?.chainId) {
            currentChain = existingChain;
            return;
        }
        const newChain = await ChainHandler.createChain({
            chainId: res.block?.header?.chainId,
            blockHeight: 1,
        });
        currentChain = newChain;
        return;
    } else {
        console.log("No Chain Found on RPC Endpoint");
        process.exit();
    }
};
seedChain();

const server = http.createServer(app);
export const io = new Server(server);

server.listen(PORT, () => console.log(`Listening on ${PORT}`));

SyncBlocks.startSync();

io.on("connection", (socket) => {
    console.log("User Connected");
    socket.on("disconnect", () => {
        console.log("User Disconnected");
    });
});
