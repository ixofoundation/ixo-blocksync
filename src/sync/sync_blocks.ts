import * as Connection from "../util/connection";
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
            const blockResult = await Connection.getBlockResult(currentBlock);
            if (blockResult !== null) {
                const block = await Connection.getBlock(currentBlock);
                await blockQueue.add("Blocks", block);
                currentBlock++;
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
}

export const restartSync = async () => {
    await stopSync();
    await startSync();
}