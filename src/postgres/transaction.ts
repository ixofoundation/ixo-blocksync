import { dbQuery } from "./client";

export type Block = {
  height: number;
  time: Date;
  transactions: Transaction[];
  messages: Message[];
  signers: TransactionSigner[];
};

export type Transaction = {
  hash: string;
  code: number;
  fee: any; // JSON
  gasUsed: string;
  gasWanted: string;
  memo: string;
  feePayer?: string;
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
  index: number;
  txIndex: number; // transient: matches parent Transaction.txIndex within the block
};

export type TransactionSigner = {
  transactionHash: string;
  signerAddress: string;
  messageIndex: number;
  authenticatorId?: string;
  sequence?: number;
  txIndex: number; // transient: matches parent Transaction.txIndex within the block
};

const insertTransactionSql = `
INSERT INTO "Transaction" (hash, code, fee, "gasUsed", "gasWanted", memo, "time", height, "feePayer", "txIndex")
SELECT tr.hash, tr.code, tr.fee, tr."gasUsed", tr."gasWanted", tr.memo, $2, $3, tr."feePayer", tr."txIndex"
FROM jsonb_to_recordset($1) AS tr(hash text, code int, fee jsonb, "gasUsed" text, "gasWanted" text, memo text, "feePayer" text, "txIndex" int)
RETURNING id, "txIndex";
`;
const insertMessageSql = `
INSERT INTO "Message" ("typeUrl", value, "transactionHash", "transactionId", "from", "to", denoms, "tokenNames", "index")
SELECT msg."typeUrl", msg.value, msg."transactionHash", msg."transactionId", msg."from", msg."to", msg.denoms, msg."tokenNames", msg."index"
FROM jsonb_to_recordset($1) AS msg("typeUrl" text, value jsonb, "transactionHash" text, "transactionId" int, "from" text, "to" text, denoms text[], "tokenNames" text[], "index" int);
`;
const insertSignerSql = `
INSERT INTO "TransactionSigner" ("transactionHash", "transactionId", "signerAddress", "messageIndex", "authenticatorId", "sequence")
SELECT s."transactionHash", s."transactionId", s."signerAddress", s."messageIndex", s."authenticatorId", s."sequence"
FROM jsonb_to_recordset($1) AS s("transactionHash" text, "transactionId" int, "signerAddress" text, "messageIndex" int, "authenticatorId" text, "sequence" int);
`;

export const insertBlock = async (block: Block): Promise<void> => {
  if (!block.transactions.length) return;

  const txResult = await dbQuery(insertTransactionSql, [
    JSON.stringify(block.transactions),
    block.time,
    block.height,
  ]);

  // Map txIndex -> generated id so messages and signers can be linked to their parent tx.
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
      index: m.index,
    }));
    await dbQuery(insertMessageSql, [JSON.stringify(messagesWithTxId)]);
  }

  if (block.signers.length) {
    const signersWithTxId = block.signers.map((s) => ({
      transactionHash: s.transactionHash,
      transactionId: txIdByIndex.get(s.txIndex),
      signerAddress: s.signerAddress,
      messageIndex: s.messageIndex,
      authenticatorId: s.authenticatorId,
      sequence: s.sequence,
    }));
    await dbQuery(insertSignerSql, [JSON.stringify(signersWithTxId)]);
  }
};
