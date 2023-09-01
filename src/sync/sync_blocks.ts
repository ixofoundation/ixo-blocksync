import * as ChainHandler from "../handlers/chain_handler";
import { sleep } from "../util/sleep";
import * as TransactionSyncHandler from "../sync_handlers/transaction_sync_handler";
import * as EventSyncHandler from "../sync_handlers/event_sync_handler";
import { currentChain } from "./sync_chain";
import { prismaCore } from "../prisma/prisma_client";

let syncing: boolean;

const logIndexTime = false;
const logFetchTime = false;
const logSync100Time = false;

export const startSync = async () => {
  syncing = true;

  let currentBlock = await ChainHandler.getLastSyncedBlockHeight(currentChain);
  console.log(`Starting Syncing at Block ${currentBlock}`);

  // if already has synced, start from next block
  if (currentBlock !== 1) currentBlock++;

  if (logSync100Time) console.time("sync");
  while (syncing) {
    try {
      if (logFetchTime) console.time("fetch");
      const block = await getBlock(currentBlock);
      if (logFetchTime) console.timeEnd("fetch");

      if (block) {
        if (logIndexTime) console.time("index");

        await Promise.all([
          EventSyncHandler.syncEvents(block.events, block.height, block.time),
          TransactionSyncHandler.syncTransactions(
            block.transactions,
            block.height,
            block.time
          ),
          ChainHandler.updateChain({
            chainId: currentChain.chainId,
            blockHeight: block.height,
          }),
        ]);

        if (block.height % 100 === 0) {
          console.log(`Synced Block ${block.height}`);
          if (logSync100Time) console.timeLog("sync");
        }

        if (logIndexTime) console.timeEnd("index");
        currentBlock++;
      } else {
        console.log(`Next block: ${currentBlock}`);
        await sleep(3000);
      }
    } catch (error) {
      console.error(`Error Adding Block ${currentBlock}: ${error}`);
    }
  }
};

export const getBlock = async (blockHeight: number) => {
  return await prismaCore.blockCore.findFirst({
    where: { height: blockHeight },
    select: {
      height: true,
      time: true,
      transactions: {
        select: {
          hash: true,
          code: true,
          fee: true,
          gasUsed: true,
          gasWanted: true,
          messages: { select: { typeUrl: true, value: true } },
        },
      },
      events: {
        // orderBy is required since blocksync-core saves beginBlock events first
        // then tx events and lastly endBlock events
        orderBy: { id: "asc" },
        select: {
          id: true,
          type: true,
          attributes: true,
        },
      },
    },
  });
};
