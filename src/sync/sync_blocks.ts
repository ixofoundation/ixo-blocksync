import * as Proto from "../util/proto";
import * as ChainHandler from "../handlers/chain_handler";
import { blockQueue } from "./queue";
import { sleep } from "../util/sleep";

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
                const data = {
                    block,
                    txsEvent,
                    bondsInfo,
                };
                await blockQueue.add("Blocks", data);
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

export const stopSync = async () => {
    syncing = false;
    await blockQueue.drain();
};

export const restartSync = async () => {
    await stopSync();
    await startSync();
};
