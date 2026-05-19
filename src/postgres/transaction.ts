import { dbQuery } from "./client";

export type Block = {
  height: number;
  time: Date;
  transactions: Transaction[];
  messages: Message[];
};

export type Transaction = {
  hash: string;
  code: number;
  fee: any; // JSON
  gasUsed: string;
  gasWanted: string;
  memo: string;
  txIndex: number;
};

export type Message = {
  typeUrl: string;
  value: any; // JSON
  from?: string;
  to?: string;
  denoms: string[];
  tokenNames: string[];
  transactionHash: string;
  txIndex: number; // transient: matches parent Transaction.txIndex within the block
};

const insertTransactionSql = `
INSERT INTO "Transaction" (hash, code, fee, "gasUsed", "gasWanted", memo, "time", height, "txIndex")
SELECT tr.hash, tr.code, tr.fee, tr."gasUsed", tr."gasWanted", tr.memo, $2, $3, tr."txIndex"
FROM jsonb_to_recordset($1) AS tr(hash text, code int, fee jsonb, "gasUsed" text, "gasWanted" text, memo text, "txIndex" int)
RETURNING id, "txIndex";
`;
const insertMessageSql = `
INSERT INTO "Message" ("typeUrl", value, "transactionHash", "transactionId", "from", "to", denoms, "tokenNames")
SELECT msg."typeUrl", msg.value, msg."transactionHash", msg."transactionId", msg."from", msg."to", msg.denoms, msg."tokenNames"
FROM jsonb_to_recordset($1) AS msg("typeUrl" text, value jsonb, "transactionHash" text, "transactionId" int, "from" text, "to" text, denoms text[], "tokenNames" text[]);
`;
export const insertBlock = async (block: Block): Promise<void> => {
  try {
    if (!block.transactions.length) return;

    const txResult = await dbQuery(insertTransactionSql, [
      JSON.stringify(block.transactions),
      block.time,
      block.height,
    ]);

    // Map txIndex -> generated id so messages can be linked to their parent tx.
    const txIdByIndex = new Map<number, number>(
      txResult.rows.map((r: any) => [r.txIndex, r.id])
    );

    if (block.messages.length) {
      const messagesWithTxId = block.messages.map((m) => ({
        typeUrl: m.typeUrl,
        value: m.value,
        transactionHash: m.transactionHash,
        transactionId: txIdByIndex.get(m.txIndex),
        from: m.from,
        to: m.to,
        denoms: m.denoms,
        tokenNames: m.tokenNames,
      }));
      await dbQuery(insertMessageSql, [JSON.stringify(messagesWithTxId)]);
    }
  } catch (error) {
    throw error;
  }
};
