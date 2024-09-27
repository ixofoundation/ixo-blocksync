import { sleep } from "../util/sleep";
import * as TransactionSyncHandler from "../sync_handlers/transaction_sync_handler";
import * as EventSyncHandler from "../sync_handlers/event_sync_handler";
import { currentChain } from "./sync_chain";
import { getCoreBlock } from "../postgres/blocksync_core/block";
import { getChain, updateChain } from "../postgres/chain";
import { withTransaction } from "../postgres/client";
import { PoolClient } from "pg";

let syncing: boolean;

const logIndexTime = false;
const logFetchTime = false;
const logSync1000Time = true;

export let currentPool: PoolClient | undefined;

export const startSync = async () => {
  syncing = true;

  let currentBlock = (await getChain(currentChain.chainId))?.blockHeight || 1;
  console.log(`Starting Syncing at Block ${currentBlock}`);

  // if already has synced, start from next block
  if (currentBlock !== 1) currentBlock++;
  let count = 0;
  let errorCount = 0;

  if (logSync1000Time) console.time("sync");
  while (syncing) {
    currentPool = undefined;
    // if (currentBlock === 460) return;
    try {
      if (logFetchTime) console.time("fetch");
      // console.log("wait then get block:", currentBlock, getMemoryUsage().rss);
      // await sleep(2000);
      const block = await getCoreBlock(currentBlock);
      if (logFetchTime) console.timeEnd("fetch");

      if (block) {
        if (logIndexTime) console.time("index");

        await withTransaction(async (client) => {
          currentPool = client;
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
          currentPool = undefined;
        });

        if (currentBlock % 1000 === 0) {
          console.log(`Synced Block ${currentBlock}`);
          if (logSync1000Time) console.timeLog("sync");
        }

        if (logIndexTime) console.timeEnd("index");
        currentBlock++;
        errorCount = 0;
        count = 0;
      } else {
        count++;
        // if count is 15, log that already on 15th attempt
        if (count === 15) {
          console.log(`Next block, 15th attempt: ${currentBlock}`);
        }
        // if count is more than 25, error out to indicate something might be wrong
        if (count > 25) {
          throw new Error("More than 25 attempts in a row, erroring...");
        }
        await sleep(1000);
      }
      errorCount = 0;
    } catch (error) {
      count = 0;
      errorCount++;

      // if error, log error and sleep for 2 seconds, to attempt self healing and retry
      console.error(`ERROR::Adding Block ${currentBlock}:: ${error}`);
      await sleep(2000);

      // if more than 3 errors in a row, exit
      if (errorCount > 3) {
        console.error("Errors for more than 3 times in a row, exiting...");
        throw error;
      }
    }
  }
};
