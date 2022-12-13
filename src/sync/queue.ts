import * as Secrets from "../util/secrets";
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
import { QueryBondsDetailedResponse } from "@ixo/impactxclient-sdk/types/codegen/ixo/bonds/v1beta1/query";
import { io } from "../index";

const connection = {
    host: Secrets.REDIS_HOST,
    port: Number(Secrets.REDIS_PORT),
};

export const blockQueue = new Queue("Blocks", { connection });

const worker = new Worker(
    "Blocks",
    async (job) => {
        try {
            const block: GetBlockByHeightResponse = job.data.block;
            const blockHeight = Number(block.block?.header?.height.low);
            const timestamp = getTimestamp({
                //@ts-ignore
                seconds: block.block?.header?.time?.seconds.low,
                //@ts-ignore
                nanos: block.block?.header?.time?.nanos,
            });
            //@ts-ignore
            const blockHash = Uint8ArrayToJS(block.blockId?.hash);

            const txsEvent: GetTxsEventResponse = job.data.txsEvent;
            const transactions = txsEvent.txs ? txsEvent.txs : [];
            const events = txsEvent.txResponses[0]
                ? txsEvent.txResponses[0].events
                : [];

            const bondsInfo: QueryBondsDetailedResponse = job.data.bondsInfo;

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
                );
            }

            if (events.length > 0) {
                await EventSyncHandler.syncEvents(
                    events,
                    blockHeight,
                    timestamp,
                );
            }

            if (bondsInfo.bondsDetailed.length > 0) {
                await BondSyncHandler.syncBondsInfo(bondsInfo, timestamp);
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

            io.emit("Block Synced", { blockHeight, blockHash, timestamp });
        } catch (error) {
            console.log({ error });
        }
    },
    { connection },
);
