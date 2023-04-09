import { prisma } from "../prisma/prisma_client";
import { TxResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/base/abci/v1beta1/abci";
import { decodeTransaction, decodeMessage } from "../util/proto";

export const syncTransactions = async (transactionResponses: TxResponse[]) => {
  if (transactionResponses.length === 0) return;

  for (const transactionResponse of transactionResponses) {
    try {
      const transaction = decodeTransaction(transactionResponse);

      await prisma.transaction.create({
        data: {
          hash: transactionResponse.txhash,
          height: Number(transactionResponse.height),
          code: transactionResponse.code,
          fee: JSON.stringify(transaction.authInfo.fee),
          gasUsed: transactionResponse.gasUsed.toString(),
          gasWanted: transactionResponse.gasWanted.toString(),
          time: new Date(transactionResponse.timestamp),
          messages: {
            create: transaction.body.messages.map((message) => {
              const value = decodeMessage(message);
              // console.log({ value });
              return {
                typeUrl: message.typeUrl,
                value: JSON.stringify(value),
                from:
                  value.fromAddress ||
                  value.ownerAddress ||
                  value.owner ||
                  value.sender ||
                  value.proposer ||
                  value.ownerDid,
                to:
                  value.toAddress ||
                  value.receiver ||
                  value.recipient ||
                  value.recipientAddress ||
                  value.recipientDid,
              };
            }),
          },
        },
      });

      // io.emit("Transaction Synced", data);
    } catch (error) {
      console.error(error);
    }
  }
};
