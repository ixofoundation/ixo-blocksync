import {Connection} from './connection';
import {BlockQueue, BlockResult, NewBlockEvent} from '../models/block';
import {ChainHandler} from '../sync_handlers/chain_handler';
import {IChain} from '../models/chain';
import {TransactionHandler} from '../sync_handlers/txn_handler';
import {StatsSyncHandler} from '../sync_handlers/stats_sync_handler';
import {IStats} from '../models/stats';
import {EventHandler} from "../sync_handlers/event_handler";

const CLI = require('clui'),
  Spinner = CLI.Spinner;

export class SyncBlocks {
  private chainHandler = new ChainHandler();
  private txnHandler = new TransactionHandler();
  private eventHandler = new EventHandler();
  private statsHandler = new StatsSyncHandler();

  startSync(chainURL: string, restURL: string) {
    let conn = new Connection(chainURL, restURL);
    const self = this;
    var confirmationInterval = setInterval(function () {
      var isConnected = conn.isConnected();
      console.log("Blockchain CONNECTED: " + isConnected);
      if (isConnected) {
        clearTimeout(confirmationInterval);
        self.performSyncing(conn);
      }
    }, 2500);
  }

  stopSync(blockQueue: BlockQueue) {
    return blockQueue.stop();
  }

  performSyncing(conn: Connection) {
    this.chainHandler.getChainInfo().then((chain: IChain) => {
      conn.getLastBlockRpc().then((block: any) => {
        if (!chain) {
          this.initChainInfo(conn, false).then((chain: IChain) => {
            this.startQueue(conn, chain);
          });
        } else if (block.header.chain_id !== chain.chainId) {
          this.initChainInfo(conn, true).then((chain: IChain) => {
            this.startQueue(conn, chain);
          });
        } else {
          this.startQueue(conn, chain);
        }
      })
        .catch((error: any) => {
          console.log("\n!!!!\nerror: " + error);
        });

    });
    this.statsHandler.getStatsInfo().then((stats: IStats) => {
      if (!stats) {
        this.statsHandler.create();
      }
    });
  }

  initChainInfo(connection: Connection, isUpdate: boolean): Promise<IChain> {
    return new Promise((resolve: Function, reject: Function) => {
      connection.getLastBlockRpc()
        .then((block: any) => {
          let chain: IChain = {chainId: block.header.chain_id, blockHeight: 0};
          if (isUpdate) {
            resolve(this.chainHandler.update(chain));
          } else {
            resolve(this.chainHandler.create(chain));
          }
        })
        .catch((err: any) => {
          console.log("err: " + err);
        });
    });
  }

  startQueue(connection: Connection, chain: IChain) {
    let blockQueue = new BlockQueue(connection, chain.blockHeight);
    var sync = new Spinner('Syncing Blocks...  ', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);

    blockQueue.onBlock((result: BlockResult, event: NewBlockEvent) => {
      this.chainHandler.setBlockHeight(result.getBlockHeight(), chain.chainId);
      const height = result.getBlockHeight();
      sync.message('Syncing block number ' + height);

      // Route transactions
      if (event.getTransactions() != null) {
        // console.log('Block Result  ' + JSON.stringify(event.getTransactions()));
        for (var i: number = 0; i < event.getTransactions().length; i++) {
          if (event.getTransactionCode(i) == undefined || 0) {
            this.txnHandler.routeTransactions(event.block.getTransaction(i));
          }
        }
      }

      // Route events from deliver_tx
      if (result.getBeginBlockEvents() != null) {
        for (var i: number = 0; i < result.getTransactionCount(); i++) {
          for (var j: number = 0; j < result.getDeliverTxEvents(i).length; j++) {
            this.eventHandler.routeEvent(result.getDeliverTxEvent(i, j), height, 'deliver_tx', `${i},${j}`);
          }
        }

        // Route events from begin_block
        for (var i: number = 0; i < result.getBeginBlockEvents().length; i++) {
          this.eventHandler.routeEvent(result.getBeginBlockEvent(i), height, 'begin_block', `${i}`);
        }

        // Route events from end_block
        for (var i: number = 0; i < result.getEndBlockEvents().length; i++) {
          this.eventHandler.routeEvent(result.getEndBlockEvent(i), height, 'end_block', `${i}`);
        }
      }
    });
    sync.start();
    blockQueue.start();
  }
}
