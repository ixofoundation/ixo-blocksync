import * as Secrets from "../util/secrets";
import * as Connection from "../util/connection";
import * as CosmosHandler from "../handlers/block_handler";
import * as TransactionSyncHandler from "../sync_handlers/transaction_sync_handler";
import * as BlockSyncHandler from "../sync_handlers/block_sync_handler";
import * as ChainHandler from "../handlers/chain_handler";
import * as EventSyncHandler from "../sync_handlers/event_sync_handler";
import * as BondSyncHandler from "../sync_handlers/bondsinfo_sync_handler";
import { currentChain } from "../index";
import { Queue, Worker } from "bullmq";
import { restartSync } from "./sync_blocks";
import { getTimestamp, Uint8ArrayToJS } from "../util/proto";
import { GetBlockByHeightResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/base/tendermint/v1beta1/query";
import { GetTxsEventResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/tx/v1beta1/service";

const connection = {
    host: Secrets.REDIS_HOST,
    port: Number(Secrets.REDIS_PORT),
};

export const blockQueue = new Queue("Blocks", { connection });

const worker = new Worker(
    "Blocks",
    async (job) => {
        const block: GetBlockByHeightResponse = job.data.block;
        const blockHeight = Number(block.block?.header?.height.low);
        //@ts-ignore
        const timestamp = getTimestamp(block.block?.header?.time);
        //@ts-ignore
        const blockHash = Uint8ArrayToJS(block.blockId?.hash);

        const txsEvent: GetTxsEventResponse = job.data.txsEvent;
        const transactions = txsEvent.txs;
        const events = txsEvent.txResponses[0].events;

        const blockExists = await CosmosHandler.isBlockSynced(blockHeight);
        if (blockExists) {
            await restartSync();
            return;
        }

        console.log(`Syncing Block ${blockHeight}`);

        if (transactions.length > 0) {
            await TransactionSyncHandler.syncTransactions(
                transactions,
                blockHeight,
            );
            await BlockSyncHandler.syncBlock(
                transactions,
                String(blockHeight),
                String(timestamp),
                txsEvent,
            );
        }

        await EventSyncHandler.syncEvents(events, blockHeight, timestamp);

        const bondsInfo = await Connection.getBondsInfo(blockHeight);
        if (bondsInfo.result) {
            await BondSyncHandler.syncBondsInfo(bondsInfo.result, timestamp);
        }

        await CosmosHandler.createBlock(
            blockHeight,
            timestamp,
            blockHash,
            block,
            txsEvent,
        );

        await ChainHandler.updateChain({
            chainId: currentChain.chainId,
            blockHeight: blockHeight,
        });

        await job.remove();
    },
    { connection },
);
