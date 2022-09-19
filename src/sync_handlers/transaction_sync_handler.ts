import { prisma } from "../prisma/prisma_client";
import { decodeTx } from "../util/connection";

export const syncTransactions = async (
    transactions: any,
    blockHeight: number,
) => {
    transactions.forEach(async (tx: any, index: number) => {
        console.log(
            `Syncing Transaction ${index + 1} for Block ${blockHeight}`,
        );
        const transaction = await decodeTx(tx);
        await prisma.transaction.create({
            data: {
                blockHeight: blockHeight,
                type: transaction.msg[0]["type"],
                from: transaction.msg[0]["value"]["from_address"]
                    ? transaction.msg[0]["value"]["from_address"]
                    : null,
                value: transaction.msg[0]["value"],
                fee: transaction.fee,
                signatures: transaction.signatures,
                memo: transaction.memo,
                timeoutHeight: transaction.timeout_height,
            },
        });
    });
};
