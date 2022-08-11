import { Connection } from "../util/connection";
import { BlockQueue, BlockResult, NewBlockEvent } from "./interface_models/Block";
import * as ChainHandler from "./handlers/chain_handler";
import { IChain } from "./interface_models/Chain";
import { TransactionHandler } from "./sync_handlers/transaction_sync_handler";
import * as StatHandler from "./handlers/stats_handler";
import { IStat } from "./interface_models/Stat";
import * as EventSyncHandler from "./sync_handlers/event_sync_handler";
import * as AuthHandler from "./handlers/auth_handler";
import { NewBondsInfo } from "./interface_models/Bond";
import * as BondSyncHandler from "./sync_handlers/bonds_sync_handler";

export class SyncBlocks {
    private TransactionHandler = new TransactionHandler();

    startSync(chainUri: string, bcRest: string, bondsInfoExtractPeriod: number | undefined) {
        const conn = new Connection(chainUri, bcRest, bondsInfoExtractPeriod);
        const self = this;
        const confirmationInterval = setInterval(function () {
            console.log("Blockchain CONNECTED: " + conn.isConnected());
            if (conn.isConnected()) {
                clearTimeout(confirmationInterval);
                self.performSyncing(conn);
            }
        }, 2500);
    };

    stopSync(blockQueue: BlockQueue) {
        return blockQueue.stop();
    };

    performSyncing(conn: Connection) {
        let chainResult = ChainHandler.getChain()[0];
        let chain: IChain = {
            chainId: chainResult?.chain_id,
            blockHeight: chainResult?.blockHeight,
        };
        conn.getLastBlock().then((block: any) => {
            if (!chain.chainId || !chain.blockHeight) {
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
                console.log("\n!!!!\n  Syncing error: " + error);
            });
        const stats = StatHandler.getStats()[0];
        if (!stats) {
            StatHandler.createStats();
        };
    };

    initChainInfo(connection: Connection, isUpdate: boolean): Promise<IChain> {
        return new Promise((resolve: Function, reject: Function) => {
            connection.getLastBlock()
                .then((block: any) => {
                    const chain: IChain = { chainId: block.header.chain_id, blockHeight: 1n };
                    if (isUpdate) {
                        resolve(ChainHandler.updateChain(chain));
                    } else {
                        resolve(ChainHandler.createChain(chain));
                    }
                })
                .catch((err: any) => {
                    console.log("err: " + err);
                });
        });
    };

    startQueue(connection: Connection, chain: IChain) {
        const blockQueue = new BlockQueue(connection, Number(chain.blockHeight));

        blockQueue.onBlock((result: BlockResult, event: NewBlockEvent) => {
            let chainDoc: IChain = {
                chainId: chain.chainId,
                blockHeight: BigInt(result.getBlockHeight()),
            }
            ChainHandler.updateChain(chainDoc);
            const height = result.getBlockHeight();
            const rawblock = result;
            const timestamp = new Date(Date.parse(event.block.block.header.time))
            console.log('Syncing block number ' + height);

            // Iterate over all transactions, if any, and route accordingly
            if (event.getTransactions() != null) {
                for (let i: number = 0; i < event.getTransactions().length; i++) {
                    if (result.getTransactionCode(i) == undefined || result.getTransactionCode(i) == 0) {
                        AuthHandler.decodeTx(event.block.getTransaction(i))
                            .then((response: any) => {
                                this.TransactionHandler.routeTransaction(response.result, String(height), String(timestamp), rawblock);
                            })
                            .catch((err) => {
                                throw (err);
                            })
                    }
                }
            }

            // Route events from deliver_tx, if any
            if (result.getDeliverTxEventsForAllTxs() != null) {
                for (let i: number = 0; i < result.getTransactionCount(); i++) {
                    for (var j: number = 0; j < result.getDeliverTxEvents(i).length; j++) {
                        EventSyncHandler.routeEvent(result.getDeliverTxEvent(i, j), BigInt(height), 'deliver_tx', [BigInt(i), BigInt(j)], timestamp);
                    }
                }
            }

            // Route events from begin_block, if any
            for (let i: number = 0; i < result.getBeginBlockEvents().length; i++) {
                EventSyncHandler.routeEvent(result.getBeginBlockEvent(i), BigInt(height), 'begin_block', [BigInt(i), BigInt(0)], timestamp);
            }

            // Route events from end_block, if any
            for (let i: number = 0; i < result.getEndBlockEvents().length; i++) {
                EventSyncHandler.routeEvent(result.getEndBlockEvent(i), BigInt(height), 'end_block', [BigInt(i), BigInt(0)], timestamp);
            }
        });

        blockQueue.onBondsInfo((bondsInfo: NewBondsInfo) => {
            const height = bondsInfo.blockHeight;
            if (height > 0) {
                console.log('Syncing bonds info at block number ' + height);
                BondSyncHandler.routeNewBondsInfo(bondsInfo);
            }
        });

        blockQueue.start();
    }
};