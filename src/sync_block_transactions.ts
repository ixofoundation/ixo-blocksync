import { expose } from "threads/worker";
import { prisma } from "./prisma/prisma_client";
import axios from "axios";
require("dotenv").config();

const RPC = process.env.CHAIN_URI;
const REST = process.env.BC_REST;

expose(async function SyncBlockTransactions() {
    let currentBlock = await getLastBlockHeight();

    while (true) {
        console.log("Syncing Transactions for Block " + currentBlock);
        try {
            const block = await getBlock(currentBlock.toString());
            if (block.data.txs.length > 0) {
                block.data.txs.forEach(async (tx: any, index: number) => {
                    console.log(`Syncing Transaction ${index + 1} for Block ${currentBlock}`);
                    const transaction = await decodeTx(tx);
                    await prisma.blockTransaction.create({
                        data: {
                            blockHeight: currentBlock,
                            msg: transaction.msg[0],
                            fee: transaction.fee,
                            signatures: transaction.signatures ? transaction.signatures : {},
                            memo: transaction.memo,
                            timeoutHeight: transaction.timeout_height,
                        },
                    });
                });
                currentBlock++;
            } else {
                currentBlock++;
            };
        } catch (error) {
            console.log("Error Syncing Transactions for Block " + currentBlock);
        };
    };
});


const getLastBlockHeight = async () => {
    const res = await prisma.blockTransaction.findMany({
        select: {
            blockHeight: true,
        },
        orderBy: {
            blockHeight: "desc",
        },
        take: 1,
    });
    const lastBlockHeight = res ? res[0].blockHeight : 0;
    return lastBlockHeight;
};

const getBlock = async (height: string) => {
    const res = await axios.get(RPC + "/block?height=" + height);
    return res.data.result.block;
};

const decodeTx = async (txData: string) => {
    const res = await axios.post(REST + "/txs/decode", { tx: txData });
    return res.data.result;
};