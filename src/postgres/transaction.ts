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
};

export type Message = {
  typeUrl: string;
  value: any; // JSON
  from?: string;
  to?: string;
  denoms: string[];
  tokenNames: string[];
  transactionHash: string;
};

const insertTransactionSql = `
INSERT INTO "Transaction" (hash, code, fee, "gasUsed", "gasWanted", memo, "time", height)
SELECT tr.hash, tr.code, tr.fee, tr."gasUsed", tr."gasWanted", tr.memo, $2, $3
FROM jsonb_to_recordset($1) AS tr(hash text, code int, fee jsonb, "gasUsed" text, "gasWanted" text, memo text);
`;
const insertMessageSql = `
INSERT INTO "Message" ("typeUrl", value, "transactionHash", "from", "to", denoms, "tokenNames")
SELECT msg."typeUrl", msg.value, msg."transactionHash", msg."from", msg."to", msg.denoms, msg."tokenNames"
FROM jsonb_to_recordset($1) AS msg("typeUrl" text, value jsonb, "transactionHash" text, "from" text, "to" text, denoms text[], "tokenNames" text[]);
`;
export const insertBlock = async (block: Block): Promise<void> => {
  try {
    // do all the insertions in a single transaction
    if (block.transactions.length) {
      await dbQuery(insertTransactionSql, [
        JSON.stringify(block.transactions),
        block.time,
        block.height,
      ]);
    }
    if (block.messages.length) {
      await dbQuery(insertMessageSql, [JSON.stringify(block.messages)]);
    }
  } catch (error) {
    throw error;
  }
};
