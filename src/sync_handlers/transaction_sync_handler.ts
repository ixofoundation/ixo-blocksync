import { prisma } from "../prisma/prisma_client";
import { createRegistry } from "@ixo/impactxclient-sdk";
import { io } from "../index";
import { TxResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/base/abci/v1beta1/abci";
import { getAddressFromDid, getTransaction } from "../util/proto";

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
                let from: string | undefined;
                let to: string | undefined;
                if (value.fromAddress) from = value.fromAddress;
                if (value.toAddress) to = value.toAddress;
                if (value.ownerAddress) from = value.ownerAddress;
                if (value.recipientDid)
                    to = await getAddressFromDid(value.recipientDid);
                if (value.owner) from = value.owner;
                if (value.recipient) to = value.recipient;
                await prisma.message.create({
                    data: {
                        transactionHash: transactionResponse.txhash,
                        typeUrl: message.typeUrl,
                        value: JSON.stringify(value),
                        from: from,
                        to: to,
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
