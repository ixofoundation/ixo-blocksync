import { Connection } from "../../util/connection";
import { NewBondsInfo } from "./Bond";

export class Block {
    block: any;

    constructor(block: any) {
        this.block = block;
    }

    getBlockHeight(): number {
        return this.block.header.height;
    }

    getChainId(): string {
        return this.block.header.chain_id;
    }

    hasTransactions(): boolean {
        return (this.getTransactionAmount() > 0);
    }

    getTransactionAmount(): number {
        return this.block.header.num_txs;
    }

    getTransactions() {
        return this.block.data.txs;
    }

    getTransaction(txnNumber: number): string {
        return this.block.data.txs[txnNumber];
    }
}

export class NewBlockEvent {
    block: Block;

    constructor(block: any) {
        this.block = new Block(block);
    }

    getBlock() {
        return this.block;
    }

    getBlockHeight(): number {
        return this.getBlock().getBlockHeight();
    }

    getChainId(): string {
        return this.getBlock().getChainId();
    }

    getTransactions() {
        return this.getBlock().getTransactions();
    }

    getTransaction(txnNumber: number): string {
        return this.getBlock().getTransactions()[txnNumber];
    }
}

export class BlockResult {
    blockResult: any;

    constructor(block: any) {
        this.blockResult = block;
    }

    getBlockHeight(): number {
        const height = this.blockResult.height
        return typeof height == "string" ? parseInt(height) : height
    }

    getEndBlockEvents(): Array<any> {
        return this.blockResult.end_block_events || [];
    }

    getEndBlockEvent(i): any {
        return this.blockResult.end_block_events[i];
    }

    getBeginBlockEvents(): Array<any> {
        return this.blockResult.begin_block_events || [];
    }

    getBeginBlockEvent(i): any {
        return this.blockResult.begin_block_events[i];
    }

    getTransactionCount(): any {
        return this.blockResult.txs_results ? this.blockResult.txs_results.length : 0;
    }

    getTransactionCode(txnNumber: number): any {
        return this.blockResult.txs_results[txnNumber].code;
    }

    getDeliverTxEventsForAllTxs(): Array<any> {
        return this.blockResult.txs_results || [];
    }

    getDeliverTxEvents(tx: number): Array<any> {
        return this.blockResult.txs_results[tx].events || [];
    }

    getDeliverTxEvent(tx: number, i): any {
        return this.blockResult.txs_results[tx].events[i];
    }
}

export class BlockQueue {
    conn: Connection;
    curBlock: number;
    onBlockCallback: Function;
    onBondsInfoCallback: Function;
    started: boolean;

    constructor(conn: Connection, startBlock: number) {
        this.conn = conn;
        this.curBlock = startBlock;
        this.started = false;
    };

    onBlock(callback: Function) {
        this.onBlockCallback = callback;
    };

    onBondsInfo(callback: Function) {
        this.onBondsInfoCallback = callback;
    };

    async sleep(ms: number = 0) {
        return new Promise(r => setTimeout(r, ms));
    };

    async start() {
        this.started = true;
        let noBlocks = false;
        while (this.started) {
            if (noBlocks) {
                await this.sleep(500);
            };

            const curBlock = this.curBlock; // save just in case this.curBlock edited

            // Get block result and block, and then bonds info
            await this.conn.getBlockResult(curBlock)
                .then((blockResult) => {
                    if (blockResult) {
                        this.conn.getBlock(curBlock)
                            .then((block) => {
                                // Process new block result and new block
                                const latestBlockEvent = new NewBlockEvent(block);
                                this.onBlockCallback(new BlockResult(blockResult), latestBlockEvent);

                                // Get bonds info for curBlock and process it
                                this.conn.getBondsInfo(curBlock)
                                    .then((bondsInfo: any) => {
                                        if (bondsInfo.result) {
                                            const blockHeight = bondsInfo.height;
                                            const blockTimestamp = new Date(Date.parse(latestBlockEvent.block.block.header.time))
                                            this.onBondsInfoCallback(new NewBondsInfo(bondsInfo.result, blockHeight, blockTimestamp))
                                        }
                                    })
                            });
                        ++this.curBlock;
                    } else {
                        noBlocks = true;
                    }
                });
        }
    }

    stop() {
        this.started = false;
    }
}
