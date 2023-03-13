import * as Proto from "../util/proto";
import * as ChainHandler from "../handlers/chain_handler";
import { sleep } from "../util/sleep";
import * as CosmosHandler from "../handlers/block_handler";
import * as TransactionSyncHandler from "../sync_handlers/transaction_sync_handler";
import * as EventSyncHandler from "../sync_handlers/event_sync_handler";
import * as BondSyncHandler from "../sync_handlers/bondsinfo_sync_handler";
import * as BlockSyncHandler from "../sync_handlers/block_sync_handler";
import { currentChain } from "..";
import { utils } from "@ixo/impactxclient-sdk";

let syncing: boolean;

export const startSync = async () => {
    syncing = true;

    let currentBlock = await ChainHandler.getLastSyncedBlockHeight();
    console.log(`Starting Syncing at Block ${currentBlock}`);
    if (currentBlock !== 1) {
        currentBlock++;
    }

    while (syncing) {
        try {
            const block = await Proto.getBlockbyHeight(currentBlock);
            const txsEvent = await Proto.getTxsEvent(currentBlock);
            const bondsInfo = await Proto.getBondsInfo();
            if (block !== undefined && txsEvent !== undefined) {
                const blockHeight = Number(block.block?.header?.height.low);
                const timestamp = utils.proto.fromTimestamp(
                    block.block!.header!.time!,
                );
                const blockHash = Buffer.from(block.blockId?.hash!)
                    .toString("hex")
                    .toUpperCase();

                const transactions = txsEvent.txs ? txsEvent.txs : [];
                const transactionResponses = txsEvent.txResponses;
                const events = txsEvent.txResponses[0]
                    ? txsEvent.txResponses.flatMap(
                          (txResponse) => txResponse.events,
                      )
                    : [];

                if (events.length > 0) {
                    await EventSyncHandler.syncEvents(
                        events,
                        blockHeight,
                        timestamp!,
                    );
                }

                if (transactionResponses.length > 0) {
                    await TransactionSyncHandler.syncTransactions(
                        transactionResponses,
                    );
                }

                if (transactions.length > 0) {
                    await BlockSyncHandler.syncBlock(
                        transactions,
                        String(blockHeight),
                        String(timestamp),
                    );
                }

                if (bondsInfo!.bondsDetailed.length > 0) {
                    await BondSyncHandler.syncBondsInfo(bondsInfo!, timestamp!);
                }

                await CosmosHandler.createBlock(
                    blockHeight,
                    timestamp!,
                    blockHash,
                    block,
                    txsEvent,
                );

                await ChainHandler.updateChain({
                    chainId: currentChain.chainId,
                    blockHeight: blockHeight,
                });

                if (blockHeight % 100 === 0) {
                    console.log(`Synced Block ${blockHeight}`);
                }

                currentBlock++;
            } else {
                console.log(`Error Adding Block ${currentBlock} to Queue`);
                await sleep(20000);
            }
        } catch (error) {
            console.log(`Error Adding Block ${currentBlock} to Queue`);
        }
    }
};
