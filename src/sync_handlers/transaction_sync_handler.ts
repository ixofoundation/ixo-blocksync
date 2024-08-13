import { decodeMessage } from "../util/proto";
import { TransactionCore } from "../postgres/blocksync_core/block";
import { insertBlock, Message, Transaction } from "../postgres/transaction";
import { getTokenName } from "../postgres/token";

export const syncTransactions = async (
  transactions: TransactionCore[],
  blockHeight: number,
  timestamp: Date
) => {
  if (transactions.length === 0) return;

  const allMessages: Message[] = [];
  const allTransactions: Transaction[] = [];

  // NOTE: consider concurrency here but might affect memory usage.
  for (const transaction of transactions) {
    // Extract and map messages to their decoded form
    for (const m of transaction.messages) {
      const value = await decodeAndProcessMessage(m, transaction.hash);
      if (value) allMessages.push(value);
    }

    allTransactions.push({
      hash: transaction.hash,
      code: transaction.code,
      fee: transaction.fee,
      memo: transaction.memo,
      gasUsed: transaction.gasUsed,
      gasWanted: transaction.gasWanted,
    });
  }

  // If no transactions, means there also cant be message, return early
  if (allTransactions.length === 0) return;

  try {
    await insertBlock({
      height: blockHeight,
      time: timestamp,
      transactions: allTransactions,
      messages: allMessages,
    });
  } catch (error) {
    console.error("ERROR::syncTransactions:: ", error.message);
  }
};

const decodeAndProcessMessage = async (
  message: any,
  transactionHash: string
): Promise<Message | null> => {
  const value = message.value;
  if (!value) return null;

  let authZExecMsgs: any[] = [];
  if (message.typeUrl === "/cosmos.authz.v1beta1.MsgExec") {
    value.msgs.forEach((m) => {
      const decodedValue = decodeMessage({
        typeUrl: m.typeUrl,
        value: Object.values(m.value),
      });
      authZExecMsgs.push({
        typeUrl: m.typeUrl,
        value: decodedValue,
      });
    });
  }

  // At moment only doing for first message if it is Authz Execution, need to improve this.
  const authzValue = authZExecMsgs.length ? authZExecMsgs[0].value : null;

  const denoms = [...new Set(getDenoms(authzValue ?? value))].filter(
    Boolean
  ) as string[];

  const tokenNames = [
    ...new Set(await getTokenNames(authzValue ?? value)),
  ].filter(Boolean) as string[];

  return {
    typeUrl: message.typeUrl,
    value: authZExecMsgs.length ? authZExecMsgs : value,
    from: getFrom(authzValue ?? value),
    to: getTo(authzValue ?? value),
    denoms,
    tokenNames,
    transactionHash,
  };
};

// Below functions do the custom indexing.
const getTo = (value: any): string | undefined => {
  return (
    value.toAddress ||
    value.receiver ||
    value.recipient ||
    value.recipientAddress ||
    value.recipientDid
  );
};

const getFrom = (value: any): string | undefined => {
  return (
    value.fromAddress ||
    value.ownerAddress ||
    value.owner ||
    value.sender ||
    value.proposer ||
    value.ownerDid
  );
};

const getDenoms = (value: any): string[] => {
  if (Array.isArray(value.amount)) {
    return value.amount.map((a: { denom: string }) => a.denom);
  } else if (value.amount) {
    return [value.amount.denom];
  } else if (value.inputs) {
    return value.inputs.flatMap((i: { coins: Array<{ denom: string }> }) =>
      i.coins.map((c) => c.denom)
    );
  } else {
    return [];
  }
};

const getTokenNames = async (value: any): Promise<string[]> => {
  if (value.mintBatch) {
    return value.mintBatch.map((m: { name: string }) => m.name);
  } else if (value.tokens) {
    return Promise.all(
      value.tokens.map(async (t: { id: string }) => await getTokenName(t.id))
    ).then((names) => names.filter(Boolean)); // Filter out falsy values such as `undefined` or empty strings.
  } else {
    return [];
  }
};
