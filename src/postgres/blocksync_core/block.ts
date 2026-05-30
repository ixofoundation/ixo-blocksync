import { corePool } from "./client";

export type BlockCore = {
  height: number;
  time: Date;
  transactions: TransactionCore[];
  events: EventCore[];
};

export type TransactionCore = {
  hash: string;
  code: number;
  fee: any; // JSON
  gasUsed: string;
  gasWanted: string;
  memo: string;
  feePayer?: string;
  signerInfos?: any; // JSON - raw signer info array from authInfo
  nonCriticalExtensionOptions?: any; // JSON - raw extension options (contains TxExtension for smart accounts)
  messages: MessageCore[];
};

export type MessageCore = {
  typeUrl: string;
  value: any; // JSON
  index: number;
};

export type EventCore = {
  type: string;
  attributes: any[]; // JSON
  transactionHash?: string;
};

const sqlTransactions = `
SELECT
  t."hash",
  t."code",
  t."fee",
  t."gasUsed",
  t."gasWanted",
  t."memo",
  t."feePayer",
  t."signerInfos",
  t."nonCriticalExtensionOptions",
  json_agg(json_build_object('typeUrl', "m"."typeUrl", 'value', m.value, 'index', m."index")) AS messages
FROM "TransactionCore" as t
LEFT OUTER JOIN "MessageCore" as m ON m."transactionId" = t.id
WHERE t."blockHeight" = $1
Group By t.id, t.hash;
`;
const sqlEvents = `
SELECT
  b."height",
  b."time",
  json_agg(json_build_object('type', e.type, 'attributes', e.attributes, 'transactionHash', e."transactionHash")) AS events
FROM "BlockCore" as b
LEFT OUTER JOIN (
  SELECT "type", attributes, "transactionHash"
    from "EventCore"
    where "blockHeight" = $1
    order by id asc
  ) as e on TRUE
WHERE b.height = $1
GROUP BY b.height, b."time"
`;

export const getCoreBlock = async (
  blockHeight: number
): Promise<BlockCore | null> => {
  let blockAndEvents: any = await corePool.query(sqlEvents, [blockHeight]);
  // If no block is found, return null before querying transactions
  if (blockAndEvents.rows.length === 0) return null;

  const transactionsResult = await corePool.query(sqlTransactions, [
    blockHeight,
  ]);

  blockAndEvents = blockAndEvents.rows[0];
  const transactions = transactionsResult.rows.map((row: any) => ({
    hash: row.hash,
    code: row.code,
    fee: row.fee,
    gasUsed: row.gasUsed,
    gasWanted: row.gasWanted,
    memo: row.memo,
    feePayer: row.feePayer,
    signerInfos: row.signerInfos,
    nonCriticalExtensionOptions: row.nonCriticalExtensionOptions,
    messages: row.messages,
  }));

  return {
    height: blockAndEvents.height,
    time: blockAndEvents.time,
    transactions,
    events: blockAndEvents.events,
  };
};
