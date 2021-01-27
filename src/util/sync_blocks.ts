import {Connection} from './connection';
import {BlockQueue, BlockResult, NewBlockEvent} from '../models/block';
import {ChainHandler} from '../sync_handlers/chain_handler';
import {IChain} from '../models/chain';
import {TransactionHandler} from '../sync_handlers/txn_handler';
import {StatsSyncHandler} from '../sync_handlers/stats_sync_handler';
import {IStats} from '../models/stats';
import {EventHandler} from "../sync_handlers/event_handler";
import {AuthHandler} from "../handlers/auth_handler";

const CLI = require('clui'),
  Spinner = CLI.Spinner;

export class SyncBlocks {
  private chainHandler = new ChainHandler();
  private txnHandler = new TransactionHandler();
  private eventHandler = new EventHandler();
  private statsHandler = new StatsSyncHandler();
  private authHandler = new AuthHandler();

  startSync(chainUri: string, bcRest: string) {
    const conn = new Connection(chainUri, bcRest);
    const self = this;
    const confirmationInterval = setInterval(function () {
      console.log("Blockchain CONNECTED: " + conn.isConnected());
      if (conn.isConnected()) {
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
      conn.getLastBlock().then((block: any) => {
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
      connection.getLastBlock()
        .then((block: any) => {
          const chain: IChain = {chainId: block.header.chain_id, blockHeight: 0};
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
    const blockQueue = new BlockQueue(connection, chain.blockHeight);
    const sync = new Spinner('Syncing Blocks...  ', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);

    blockQueue.onBlock((result: BlockResult, event: NewBlockEvent) => {
      this.chainHandler.setBlockHeight(result.getBlockHeight(), chain.chainId);
      const height = result.getBlockHeight();
      const timestamp = new Date(Date.parse(event.block.block.header.time))
      sync.message('Syncing block number ' + height);

      // Iterate over all transactions, if any, and route accordingly
      if (event.getTransactions() != null) {
        for (let i: number = 0; i < event.getTransactions().length; i++) {
          if (result.getTransactionCode(i) == undefined || result.getTransactionCode(i) == 0) {
            this.authHandler.decodeTx(event.block.getTransaction(i))
              .then((response: any) => {
                this.txnHandler.routeTransaction(response.result);
              })
              .catch((err) => {
                throw(err);
              })
          }
        }
      }

      // Route events from deliver_tx, if any
      if (result.getDeliverTxEventsForAllTxs() != null) {
        for (let i: number = 0; i < result.getTransactionCount(); i++) {
          for (var j: number = 0; j < result.getDeliverTxEvents(i).length; j++) {
            this.eventHandler.routeEvent(result.getDeliverTxEvent(i, j), height, 'deliver_tx', [i, j], timestamp);
          }
        }
      }

      // Route events from begin_block, if any
      for (let i: number = 0; i < result.getBeginBlockEvents().length; i++) {
        this.eventHandler.routeEvent(result.getBeginBlockEvent(i), height, 'begin_block', [i, 0], timestamp);
      }

      // Route events from end_block, if any
      for (let i: number = 0; i < result.getEndBlockEvents().length; i++) {
        this.eventHandler.routeEvent(result.getEndBlockEvent(i), height, 'end_block', [i, 0], timestamp);
      }
    });
    sync.start();
    blockQueue.start();
  }
}
