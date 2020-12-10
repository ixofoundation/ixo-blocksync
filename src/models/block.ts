import {Connection} from "../util/connection";

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
    return (this.block.data.txs[txnNumber]);
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
    return (this.getBlock().getTransactions()[txnNumber]);
  }

  getTransactionCode(txnNumber: number): string {
    return (this.getBlock().getTransactions()[txnNumber].code);
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

  getDeliverTxEvents(tx: number): Array<any> {
    return this.blockResult.txs_results[tx].events;
  }

  getDeliverTxEvent(tx: number, i): any {
    return this.blockResult.txs_results[tx].events[i];
  }
}

export class BlockQueue {

  conn: Connection;
  curBlock: number;
  callback: Function;
  started: boolean;

  constructor(conn: Connection, startBlock: number) {
    this.conn = conn;
    this.curBlock = startBlock;
    this.started = false;
  }

  onBlock(callback: Function) {
    this.callback = callback;
  }

  async sleep(ms: number = 0) {
    return new Promise(r => setTimeout(r, ms));
  }

  async start() {
    this.started = true;
    let noBlocks = false;
    while (this.started) {
      if (noBlocks) {
        await this.sleep(500);
      }
      await this.conn.getBlockResult(this.curBlock)
        .then((blockResult) => {
          if (blockResult) {
            this.conn.getBlock(this.curBlock)
              .then((block) => {
                this.callback(new BlockResult(blockResult), new NewBlockEvent(block));
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
