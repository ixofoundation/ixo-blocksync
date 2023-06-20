import { prisma } from "../prisma/prisma_client";
import { TxResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/base/abci/v1beta1/abci";
import { decodeTransaction, decodeMessage } from "../util/proto";

export const syncTransactions = async (transactionResponses: TxResponse[]) => {
  if (transactionResponses.length === 0) return;

  for (const transactionResponse of transactionResponses) {
    try {
      const transaction = decodeTransaction(transactionResponse);

      const messages = await Promise.all(
        transaction.body.messages.map(async (message) => {
          const value = decodeMessage(message);
          if (!value) return;

          // TODO handle decoded authz msgs into amount/from/to/denom/tokenNames
          let authZExecMsgs = [];
          if (message.typeUrl === "/cosmos.authz.v1beta1.MsgExec") {
            authZExecMsgs = value.msgs.map((m) => decodeMessage(m));
          }
          // if (authZExecMsgs.length > 0)
          //   console.dir(authZExecMsgs[0], { depth: null });

          let denoms = Array.isArray(value.amount)
            ? value.amount.map((a) => a.denom)
            : value.amount
            ? [value.amount.denom]
            : value.inputs
            ? value.inputs.map((i) => i.coins.map((c) => c.denom)).flat()
            : [];
          denoms = [...new Set(denoms)];
          let tokenNames = value.mintBatch
            ? value.mintBatch.map((m) => m.name)
            : value.tokens
            ? await Promise.all(
                value.tokens.map(async (t) => {
                  const token = await prisma.token.findFirst({
                    where: { id: t.id },
                    select: { name: true },
                  });
                  return token?.name;
                })
              )
            : [];
          tokenNames = [...new Set(tokenNames.filter((t) => t))];

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
            denoms,
            tokenNames,
          };
        })
      );

      await prisma.transaction.create({
        data: {
          hash: transactionResponse.txhash,
          height: Number(transactionResponse.height),
          code: transactionResponse.code,
          fee: JSON.stringify(transaction.authInfo.fee),
          gasUsed: transactionResponse.gasUsed.toString(),
          gasWanted: transactionResponse.gasWanted.toString(),
          time: new Date(transactionResponse.timestamp),
          messages: { create: messages },
        },
      });

      // io.emit("Transaction Synced", data);
    } catch (error) {
      console.error(error.message);
    }
  }
};
