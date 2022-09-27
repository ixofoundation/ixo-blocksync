import * as Connection from "../util/connection";
import * as ChainHandler from "../handlers/chain_handler";
import { currentChain } from "../server";
import { blockQueue } from "./queue";
import { sleep } from "../util/sleep";

export const startSync = async () => {
    let currentBlock = await ChainHandler.getLastSyncedBlockHeight();

    while (true) {
        try {
            const blockResult = await Connection.getBlockResult(currentBlock);
            if (blockResult !== null) {
                const block = await Connection.getBlock(currentBlock);
                await blockQueue.add("Blocks", block);
                await ChainHandler.updateChain({
                    chainId: currentChain.chainId,
                    blockHeight: currentBlock,
                });
                currentBlock++;
            } else {
                await sleep(10000);
            }
        } catch (error) {
            console.log(`Error Adding Block ${currentBlock} to Queue`);
        }
    }
};
