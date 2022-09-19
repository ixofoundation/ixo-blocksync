import * as Secrets from "../util/secrets";
import * as Connection from "../util/connection";
import * as CosmosHandler from "../handlers/block_handler";
import * as TransactionSyncHandler from "../sync_handlers/transaction_sync_handler";
import * as BlockSyncHandler from "../sync_handlers/block_sync_handler";
import * as EventSyncHandler from "../sync_handlers/event_sync_handler";
import * as BondSyncHandler from "../sync_handlers/bondsinfo_sync_handler";
import { Queue, Worker } from "bullmq";

const connection = {
    host: Secrets.REDIS_HOST,
    port: Number(Secrets.REDIS_PORT),
};

export const blockQueue = new Queue("Blocks", { connection });

const worker = new Worker(
    "Blocks",
    async (job) => {
        const block = job.data;
        const blockHeight = Number(block.header.height);
        const transactions = block.data.txs;
        const timestamp = new Date(Date.parse(block.header.time));

        const blockHash = await Connection.getBlockHash(blockHeight);
        const blockResult = await Connection.getBlockResult(blockHeight);

        console.log(`Syncing Block ${blockHeight}`);

        await CosmosHandler.createBlock(blockHash, block, blockResult);

        if (transactions.length > 0) {
            await TransactionSyncHandler.syncTransactions(
                transactions,
                blockHeight,
            );
            await BlockSyncHandler.syncBlock(
                transactions,
                String(blockHeight),
                String(timestamp),
                blockResult,
            );
        }

        await EventSyncHandler.syncEvents(blockResult, blockHeight, timestamp);

        const bondsInfo = await Connection.getBondsInfo(blockHeight);
        if (bondsInfo.result)
            await BondSyncHandler.syncBondsInfo(bondsInfo.result, timestamp);
    },
    { connection },
);
