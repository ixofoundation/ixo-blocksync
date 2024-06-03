import { sleep } from "../util/sleep";
import * as TransactionSyncHandler from "../sync_handlers/transaction_sync_handler";
import * as EventSyncHandler from "../sync_handlers/event_sync_handler";
import { currentChain } from "./sync_chain";
import { getCoreBlock } from "../postgres/blocksync_core/block";
import { getChain, updateChain } from "../postgres/chain";

let syncing: boolean;

const logIndexTime = false;
const logFetchTime = false;
const logSync1000Time = true;

export const startSync = async () => {
  syncing = true;

  let currentBlock = (await getChain(currentChain.chainId))?.blockHeight || 1;
  console.log(`Starting Syncing at Block ${currentBlock}`);

  // if already has synced, start from next block
  if (currentBlock !== 1) currentBlock++;

  let count = 0;
  if (logSync1000Time) console.time("sync");
  while (syncing) {
    // if (currentBlock === 10001) return;
    try {
      if (logFetchTime) console.time("fetch");
      // console.log("wait then get block:", currentBlock, getMemoryUsage().rss);
      // await sleep(2000);
      const block = await getCoreBlock(currentBlock);
      if (logFetchTime) console.timeEnd("fetch");

      if (block) {
        count = 0;
        if (logIndexTime) console.time("index");

        await Promise.all([
          EventSyncHandler.syncEvents(block.events, block.height, block.time),
          TransactionSyncHandler.syncTransactions(
            block.transactions,
            block.height,
            block.time
          ),
          updateChain({
            chainId: currentChain.chainId,
            blockHeight: block.height,
          }),
        ]);

        if (currentBlock % 1000 === 0) {
          console.log(`Synced Block ${currentBlock}`);
          if (logSync1000Time) console.timeLog("sync");
        }

        if (logIndexTime) console.timeEnd("index");
        currentBlock++;
      } else {
        count++;
        if (count === 15) {
          console.log(`Next block, 15th attempt: ${currentBlock}`);
        }
        await sleep(1000);
      }
    } catch (error) {
      console.error(`Error Adding Block ${currentBlock}: ${error}`);
      break;
    }
  }
};
