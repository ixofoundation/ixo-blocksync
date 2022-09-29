require("log-timestamp");

import { app } from "./app";
import { Chain } from "@prisma/client";
import * as Connection from "./util/connection";
import * as StatsHandler from "./handlers/stats_handler";
import * as ChainHandler from "./handlers/chain_handler";
import * as SyncBlocks from "./sync/sync_blocks";
import { PORT } from "./util/secrets";

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

Connection.testConnection();

SyncBlocks.startSync();

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
