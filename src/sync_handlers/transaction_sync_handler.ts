import { prisma } from "../prisma/prisma_client";
import { GetTransactionsType } from "../types/getBlock";
import { decodeMessage } from "../util/proto";

export const syncTransactions = async (
  transactions: GetTransactionsType,
  blockHeight: number,
  timestamp: Date
) => {
  if (transactions.length === 0) return;

  for (const transaction of transactions) {
    try {
      const messages = await Promise.all(
        transaction.messages.map(async (message) => {
          const value = message.value as any;

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
            value: value,
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
          hash: transaction.hash,
          height: blockHeight,
          code: transaction.code,
          fee: transaction.fee as any,
          gasUsed: transaction.gasUsed,
          gasWanted: transaction.gasWanted,
          time: timestamp,
          messages: { create: messages },
        },
      });
    } catch (error) {
      console.error("syncTransaction: ", error.message);
    }
  }
};
