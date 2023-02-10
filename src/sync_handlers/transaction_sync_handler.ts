import { Tx } from "@ixo/impactxclient-sdk/types/codegen/cosmos/tx/v1beta1/tx";
import { prisma } from "../prisma/prisma_client";
import { createRegistry, utils } from "@ixo/impactxclient-sdk";
import { io } from "../index";

export const syncTransactions = async (
    transactions: Tx[],
    blockHeight: number,
) => {
    for (const [index, tx] of transactions.entries()) {
        try {
            console.log(
                `Syncing Transaction ${index + 1} for Block ${blockHeight}`,
            );

            const messages: any[] = [];
            for (const message of tx.body?.messages || []) {
                try {
                    const registry = createRegistry();
                    const msg = {
                        type: message.typeUrl,
                        value: await registry.decode(message),
                    };
                    messages.push(msg);
                } catch (error) {
                    console.log(error);
                }
            }

            const fee = tx.authInfo?.fee ? tx.authInfo.fee : {};
            const signatures: string[] = [""];
            for (const sig of tx.signatures) {
                signatures.push(utils.conversions.Uint8ArrayToJS(sig));
            }
            const memo = tx.body?.memo ? tx.body.memo : "";
            const timeoutHeight = String(tx.body?.timeoutHeight.low);

            await prisma.transaction.create({
                data: {
                    blockHeight: blockHeight,
                    messages: JSON.stringify(messages),
                    fee: fee,
                    signatures: signatures,
                    memo: memo,
                    timeoutHeight: timeoutHeight,
                },
            });

            io.emit("Transaction Synced", {
                blockHeight,
                messages,
                fee,
                signatures,
                memo,
                timeoutHeight,
            });
        } catch (error) {
            console.log(error);
        }
    }
};
