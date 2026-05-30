import { decodeMessage } from "../util/proto";
import {
  BlockCore,
  MessageCore,
  TransactionCore,
} from "../postgres/blocksync_core/block";
import {
  insertBlock,
  Message,
  Transaction,
  TransactionSigner,
} from "../postgres/transaction";
import { getTokenName } from "../postgres/token";
import { ixo } from "@ixo/impactxclient-sdk";

const TX_EXTENSION_TYPE_URL = "/ixo.smartaccount.v1beta1.TxExtension";

export const syncTransactions = async (block: BlockCore) => {
  if (block.transactions.length === 0) return;

  const allMessages: Message[] = [];
  const allTransactions: Transaction[] = [];
  const allSigners: TransactionSigner[] = [];

  // NOTE: consider concurrency here but might affect memory usage.
  for (let txIndex = 0; txIndex < block.transactions.length; txIndex++) {
    const transaction = block.transactions[txIndex];
    const selectedAuthenticators = extractSelectedAuthenticators(transaction);
    // Get sequence from signerInfos (usually first signer for fee payer)
    const sequence = transaction.signerInfos?.[0]?.sequence;

    // Extract and map messages to their decoded form
    for (const m of transaction.messages) {
      const value = await decodeAndProcessMessage(m, transaction.hash, txIndex);
      if (value) {
        allMessages.push(value);

        const signerAddress = extractSignerFromMessage(value.value);
        if (signerAddress) {
          // Get authenticatorId for this message index if using smart accounts
          const authenticatorId = selectedAuthenticators?.[m.index]?.toString();

          allSigners.push({
            transactionHash: transaction.hash,
            signerAddress,
            messageIndex: m.index,
            authenticatorId,
            sequence,
            txIndex,
          });
        }
      }
    }

    allTransactions.push({
      hash: transaction.hash,
      code: transaction.code,
      fee: transaction.fee,
      memo: transaction.memo,
      gasUsed: transaction.gasUsed,
      gasWanted: transaction.gasWanted,
      feePayer: transaction.feePayer,
      txIndex,
    });
  }

  // If no transactions, means there also cant be message, return early
  if (allTransactions.length === 0) return;

  try {
    await insertBlock({
      height: block.height,
      time: block.time,
      transactions: allTransactions,
      messages: allMessages,
      signers: allSigners,
    });
  } catch (error) {
    console.error("ERROR::syncTransactions:: ", error.message);
  }
};

/**
 * Extract selected authenticators from nonCriticalExtensionOptions.
 * Decodes TxExtension to get selected_authenticators array.
 * Returns array of authenticator IDs (one per message) or undefined if not a smart account tx.
 */
const extractSelectedAuthenticators = (
  transaction: TransactionCore
): number[] | undefined => {
  const extensions = transaction.nonCriticalExtensionOptions;
  if (!extensions || extensions.length === 0) return undefined;

  for (const ext of extensions) {
    if (ext.typeUrl === TX_EXTENSION_TYPE_URL) {
      try {
        // The value is stored as base64, decode it
        const valueBytes =
          typeof ext.value === "string"
            ? Buffer.from(ext.value, "base64")
            : ext.value;

        // Decode the TxExtension to get selected_authenticators
        const txExtension =
          ixo.smartaccount.v1beta1.TxExtension.decode(valueBytes);
        if (
          txExtension.selectedAuthenticators &&
          txExtension.selectedAuthenticators.length > 0
        ) {
          // Convert Long to number
          return txExtension.selectedAuthenticators.map((id) =>
            typeof id === "number" ? id : Number(id)
          );
        }
      } catch (error) {
        console.error("Error decoding TxExtension:", error);
      }
    }
  }
  return undefined;
};

/**
 * Extract the signer address from decoded message content.
 * Tries common field names used across different message types.
 * Can see the blockchain proto files for more details.
 */
const extractSignerFromMessage = (value: any): string | undefined => {
  // Handle authz exec messages - get signer from the wrapped message
  if (Array.isArray(value) && value.length > 0 && value[0]?.value) {
    return extractSignerFromMessage(value[0].value);
  }

  return (
    value.sender ||
    value.fromAddress ||
    value.owner ||
    value.ownerAddress ||
    value.delegatorAddress ||
    value.voterAddress ||
    value.proposer ||
    value.grantee ||
    value.granter ||
    value.admin ||
    value.creator ||
    value.authority ||
    value.signer ||
    value.ownerDid
  );
};

const decodeAndProcessMessage = async (
  message: MessageCore,
  transactionHash: string,
  txIndex: number
): Promise<Message | null> => {
  const value = message.value;
  if (!value) return null;

  let authZExecMsgs: any[] = [];
  if (message.typeUrl === "/cosmos.authz.v1beta1.MsgExec") {
    value.msgs.forEach((m: any) => {
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
    index: message.index,
    txIndex,
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
