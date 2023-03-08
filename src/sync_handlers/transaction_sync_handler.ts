import { prisma } from "../prisma/prisma_client";
import { createRegistry } from "@ixo/impactxclient-sdk";
import { io } from "../index";
import { TxResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/base/abci/v1beta1/abci";
import { getTransaction } from "../util/proto";

export const syncTransactions = async (transactionResponses: TxResponse[]) => {
    for (const transactionResponse of transactionResponses) {
        try {
            const registry = createRegistry();
            const transaction = await getTransaction(
                transactionResponse.txhash,
            );
            await prisma.transaction.create({
                data: {
                    hash: transactionResponse.txhash,
                    height: Number(transactionResponse.height),
                    code: transactionResponse.code,
                    fee: JSON.stringify(transaction!.tx!.authInfo!.fee),
                    gasUsed: transactionResponse.gasUsed.toString(),
                    gasWanted: transactionResponse.gasWanted.toString(),
                    time: new Date(transactionResponse.timestamp),
                },
            });
            for (const message of transaction!.tx!.body!.messages) {
                const value = await registry.decode(message);
                await prisma.message.create({
                    data: {
                        transactionHash: transactionResponse.txhash,
                        typeUrl: message.typeUrl,
                        value: JSON.stringify(value),
                        from: value.fromAddress ? value.fromAddress : "",
                        to: value.toAddress ? value.toAddress : "",
                    },
                });
            }
            io.emit("Transaction Synced", {
                hash: transactionResponse.txhash,
                height: Number(transactionResponse.height),
                code: transactionResponse.code,
                fee: JSON.stringify(transaction!.tx!.authInfo!.fee),
                gasUsed: transactionResponse.gasUsed.toString(),
                gasWanted: transactionResponse.gasWanted.toString(),
                time: new Date(transactionResponse.timestamp),
            });
        } catch (error) {
            console.log(error);
        }
    }
};
