import { Connection } from "./connection";
import { BlockQueue, NewBlockEvent } from "../models/block";
import { ChainHandler } from "../handlers/chain_handler";
import { IChain } from "../models/chain";
const CLI = require('clui'),
    Spinner = CLI.Spinner;

export class SyncBlocks {
    private chainHandler = new ChainHandler();

    startSync(chainUri: string) {
        let conn = new Connection(chainUri);
        this.chainHandler.getChainInfo().then((chain: IChain) => {
            if (!chain) {
                this.initChainInfo(conn).then((chain: IChain) => {
                    this.startQueue(conn, chain);
                });
            } else {
                this.startQueue(conn, chain);
            }
        });
    }

    stopSync(blockQueue: BlockQueue) {
        return blockQueue.stop();
    }

    initChainInfo(connection: Connection): Promise<IChain> {
        return new Promise((resolve: Function, reject: Function) => {
            connection.getLastBlock().then((block: any) => {
                let chain: IChain = { chainId: block.header.chain_id, blockHeight: 0 };
                resolve(this.chainHandler.create(chain));
            })
        });
    }

    startQueue(connection: Connection, chain: IChain) {
        let blockQueue = new BlockQueue(connection, chain.blockHeight);
        var sync = new Spinner('Syncing Blocks...  ', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);

        blockQueue.onBlock((event: NewBlockEvent) => {
            this.chainHandler.setBlockHeight(event.getBlockHeight(), event.getChainId())
            sync.message('Syncing block number ' + event.getBlockHeight());
        });

        sync.start();
        blockQueue.start();
    }
}





