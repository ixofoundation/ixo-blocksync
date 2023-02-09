import { Tx } from "@ixo/impactxclient-sdk/types/codegen/cosmos/tx/v1beta1/tx";
import { prisma } from "../prisma/prisma_client";
import { decode } from "../util/proto";
import { utils } from "@ixo/impactxclient-sdk";
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

            const type = String(tx.body?.messages[0].typeUrl);
            const value = await decode(tx.body?.messages[0]);
            const from = value.from_address ? value.from_address : null;
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
                    type: type,
                    from: from,
                    value: value,
                    fee: fee,
                    signatures: signatures,
                    memo: memo,
                    timeoutHeight: timeoutHeight,
                },
            });

            io.emit("Transaction Synced", {
                blockHeight,
                type,
                from,
                value,
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
