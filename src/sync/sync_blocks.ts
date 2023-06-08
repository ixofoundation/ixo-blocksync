import * as Proto from "../util/proto";
import * as ChainHandler from "../handlers/chain_handler";
import { sleep } from "../util/sleep";
import * as BlockHandler from "../handlers/block_handler";
import * as TransactionSyncHandler from "../sync_handlers/transaction_sync_handler";
import * as EventSyncHandler from "../sync_handlers/event_sync_handler";
import * as BondSyncHandler from "../sync_handlers/bondsinfo_sync_handler";
import * as BlockSyncHandler from "../sync_handlers/block_sync_handler";
import { Event } from "@cosmjs/tendermint-rpc/build/tendermint34/responses";
import { currentChain } from "./sync_chain";
import { utils } from "@ixo/impactxclient-sdk";
import { upperHexFromUint8Array } from "../util/helpers";

let syncing: boolean;

export const startSync = async () => {
  syncing = true;

  let currentBlock = await ChainHandler.getLastSyncedBlockHeight(currentChain);
  console.log(`Starting Syncing at Block ${currentBlock}`);

  // if already has synced, start from next block
  if (currentBlock !== 1) currentBlock++;

  // console.time("sync");
  while (syncing) {
    try {
      const [block, txsEvent, bondsInfo, blockTM] = await Promise.all([
        Proto.getBlockbyHeight(currentBlock),
        Proto.getTxsEvent(currentBlock),
        Proto.getBondsInfo(),
        Proto.getTMBlockbyHeight(currentBlock),
      ]);

      if (block && txsEvent && blockTM) {
        // if block and events is not null, check if block has txs and then if events has
        // no trx, means abci layer is behind tendermint layer, wait 3 seconds and try again
        if (block.block?.data?.txs.length && !txsEvent.txs.length) {
          console.log(
            "ABCI Layer behind Tendermint Layer, waiting 3 seconds and trying again"
          );
          await sleep(3000);
          continue;
        }

        const blockHeight = Number(block.block!.header!.height.low);
        const timestamp = utils.proto.fromTimestamp(block.block!.header!.time!);
        const blockHash = upperHexFromUint8Array(block.blockId!.hash!);
        const transactionResponses = txsEvent.txResponses;

        await Promise.all([
          EventSyncHandler.syncEvents(
            blockTM.beginBlockEvents as Event[],
            transactionResponses.flatMap((txRes) => txRes.events),
            blockTM.endBlockEvents as Event[],
            blockHeight,
            timestamp!
          ),
          TransactionSyncHandler.syncTransactions(transactionResponses),

          // TODO old bonds trx indexing, need to convert to events based indexing
          BlockSyncHandler.syncBlock(
            transactionResponses,
            String(blockHeight),
            String(timestamp)
          ),
          BondSyncHandler.syncBondsInfo(bondsInfo!, timestamp!),

          BlockHandler.createBlock(
            blockHeight,
            timestamp!,
            blockHash,
            block,
            txsEvent
          ),
          ChainHandler.updateChain({
            chainId: currentChain.chainId,
            blockHeight: blockHeight,
          }),
        ]);

        if (blockHeight % 100 === 0) {
          console.log(`Synced Block ${blockHeight}`);
          // console.timeLog("sync");
        }

        currentBlock++;
      } else {
        console.log(`Next block: ${currentBlock}`);
        await sleep(3000);
      }
    } catch (error) {
      console.error(`Error Adding Block ${currentBlock}`);
    }
  }
};
