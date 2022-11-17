import * as Proto from "../util/proto";
import * as ChainHandler from "../handlers/chain_handler";
import { blockQueue } from "./queue";
import { sleep } from "../util/sleep";

let syncing: boolean;

export const startSync = async () => {
    syncing = true;

    let currentBlock = await ChainHandler.getLastSyncedBlockHeight();
    if (currentBlock !== 1) {
        currentBlock++;
    }

    while (syncing) {
        try {
            const txsEvent = await Proto.getTxsEvent(currentBlock);
            if (txsEvent) {
                const block = await Proto.getBlockbyHeight(currentBlock);
                if (block) {
                    await blockQueue.add("Blocks", { block, txsEvent });
                    currentBlock++;
                }
            } else {
                await sleep(20000);
            }
        } catch (error) {
            console.log(`Error Adding Block ${currentBlock} to Queue`);
        }
    }
};

export const stopSync = async () => {
    syncing = false;
    await blockQueue.drain();
};

export const restartSync = async () => {
    await stopSync();
    await startSync();
};
