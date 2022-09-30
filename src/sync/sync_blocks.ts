import * as Connection from "../util/connection";
import * as ChainHandler from "../handlers/chain_handler";
import { blockQueue } from "./queue";
import { sleep } from "../util/sleep";

export const startSync = async () => {
    let currentBlock = await ChainHandler.getLastSyncedBlockHeight();
    currentBlock++;

    while (true) {
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
