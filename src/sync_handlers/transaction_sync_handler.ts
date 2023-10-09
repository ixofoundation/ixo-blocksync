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

          let authZExecMsgs: any[] = [];
          if (message.typeUrl === "/cosmos.authz.v1beta1.MsgExec") {
            authZExecMsgs = value.msgs.map((m) => ({
              typeUrl: m.typeUrl,
              value: decodeMessage({
                typeUrl: m.typeUrl,
                value: Object.values(m.value),
              }),
            }));
            // console.log(authZExecMsgs);
          }
          // At moment only doing for first message if it is Authz Execution, need to improve this.
          const authzValue = authZExecMsgs.length
            ? authZExecMsgs[0].value
            : null;

          const denoms = [
            ...new Set(getDenoms(authzValue ?? value).filter((d) => d)),
          ] as string[];
          const tokenNames = [
            ...new Set(
              (await getTokenNames(authzValue ?? value)).filter((t) => t)
            ),
          ] as string[];

          return {
            typeUrl: message.typeUrl,
            value: authZExecMsgs.length ? authZExecMsgs : value,
            from: getFrom(authzValue ?? value),
            to: getTo(authzValue ?? value),
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
          memo: transaction.memo,
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

// Below functions do the custom indexing.
const getTo = (value: any) => {
  return (
    value.toAddress ||
    value.receiver ||
    value.recipient ||
    value.recipientAddress ||
    value.recipientDid
  );
};

const getFrom = (value: any) => {
  return (
    value.fromAddress ||
    value.ownerAddress ||
    value.owner ||
    value.sender ||
    value.proposer ||
    value.ownerDid
  );
};

const getDenoms = (value: any) => {
  return Array.isArray(value.amount)
    ? value.amount.map((a) => a.denom)
    : value.amount
    ? [value.amount.denom]
    : value.inputs
    ? value.inputs.map((i) => i.coins.map((c) => c.denom)).flat()
    : [];
};

const getTokenNames = async (value: any) => {
  return value.mintBatch
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
};
