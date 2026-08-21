import { sleep } from "../util/sleep";
import * as TransactionSyncHandler from "../sync_handlers/transaction_sync";
import * as EventSyncHandler from "../sync_handlers/event_sync";
import * as AuthzPostgres from "../postgres/authz";
import { currentChain } from "./sync_chain";
import { getCoreBlock } from "../postgres/blocksync_core/block";
import { getChain, updateChain } from "../postgres/chain";
import { withTransaction } from "../postgres/client";
import { PoolClient } from "pg";
import { ensureDaodaoSnapshot } from "./daodao_snapshot";
import { ensureV7Snapshot } from "./v7_snapshot";

let syncing: boolean;

const logIndexTime = false;
const logFetchTime = false;
const logSync1000Time = true;

export let currentPool: PoolClient | undefined;

// Setter for the per-block transaction client. ES module imports are
// read-only bindings from the outside, so anything outside this module
// (e.g. the snapshot routines) needs this setter to thread its own
// transaction client through `dbQuery`.
export const setCurrentPool = (c: PoolClient | undefined) => {
  currentPool = c;
};

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
    setCurrentPool(undefined);
    // if (currentBlock === 460) return;
    try {
      if (logFetchTime) console.time("fetch");
      // console.log("wait then get block:", currentBlock, getMemoryUsage().rss);
      // await sleep(2000);
      const block = await getCoreBlock(currentBlock);
      if (logFetchTime) console.timeEnd("fetch");

      if (block) {
        if (logIndexTime) console.time("index");

        // First time we reach the chain's wasm-cutoff height, take a
        // one-shot daodao state snapshot BEFORE indexing this block.
        // This runs once per blocksync DB (tracked in
        // daodao_snapshot_state). It needs to run outside the per-block
        // transaction so its many archive-API calls and per-DAO writes
        // aren't held in a single long-lived txn.
        await ensureDaodaoSnapshot(block.height);

        // Same idea for the v7 chain upgrade — at the upgrade block the
        // chain performs silent KV writes (liquidstake multi-pool reshape,
        // claims dispute migration) that don't surface as events. We
        // mirror them once via ensureV7Snapshot. No-op when
        // V7_UPGRADE_HEIGHT is 0 (i.e. v7 not yet applied on this
        // network).
        await ensureV7Snapshot(block.height);

        await withTransaction(async (client) => {
          setCurrentPool(client);
          try {
            await Promise.all([
              EventSyncHandler.syncEvents(block),
              TransactionSyncHandler.syncTransactions(block),
              updateChain({
                chainId: currentChain.chainId,
                blockHeight: block.height,
              }),
            ]);

            // Per-block authz expiry sweep: on-chain expiry pruning emits no
            // event, so mirror it here against the BLOCK time (not wall
            // clock) - correct for live sync and historical resyncs alike.
            await AuthzPostgres.deleteExpiredAuthzGrants(block.time);
          } finally {
            setCurrentPool(undefined);
          }
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
