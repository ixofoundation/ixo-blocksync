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
  messages: MessageCore[];
};

export type MessageCore = {
  typeUrl: string;
  value: any; // JSON
};

export type EventCore = {
  type: string;
  attributes: any[]; // JSON
};

const sqlTransactions = `
SELECT   
  t."hash",
  t."code",
  t."fee",
  t."gasUsed",
  t."gasWanted",
  t."memo",
  json_agg(json_build_object('typeUrl', "m"."typeUrl", 'value', m.value)) AS messages
FROM "TransactionCore" as t
LEFT OUTER JOIN "MessageCore" as m ON t.hash = m."transactionHash" 
WHERE t."blockHeight" = $1
Group By t.hash;
`;
const sqlEvents = `
SELECT
  b."height",
  b."time",
  json_agg(json_build_object('type', e.type, 'attributes', e.attributes)) AS events
FROM "BlockCore" as b
LEFT OUTER JOIN (
  SELECT "type", attributes
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
  try {
    let blockAndEvents: any = await corePool.query(sqlEvents, [blockHeight]);
    // If no block is found, return null before querying transactions
    if (blockAndEvents.rows.length === 0) return null;
    let transactions: any = await corePool.query(sqlTransactions, [
      blockHeight,
    ]);

    blockAndEvents = blockAndEvents.rows[0];
    transactions = transactions.rows.map((row: any) => ({
      hash: row.hash,
      code: row.code,
      fee: row.fee,
      gasUsed: row.gasUsed,
      gasWanted: row.gasWanted,
      memo: row.memo,
      messages: row.messages,
    }));

    return {
      height: blockAndEvents.height,
      time: blockAndEvents.time,
      transactions,
      events: blockAndEvents.events,
    };
  } catch (error) {
    throw error;
  }
};
