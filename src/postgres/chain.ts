import { dbQuery } from "./client";

export type Chain = {
  chainId: string;
  blockHeight: number;
};

const getChainSql = `
SELECT * FROM "Chain" WHERE "chainId" = $1;
`;
export const getChain = async (chainId: string): Promise<Chain | undefined> => {
  const res = await dbQuery(getChainSql, [chainId]);
  return res.rows[0];
};

const createChainSql = `
INSERT INTO "Chain" ("chainId", "blockHeight") VALUES ($1, $2) RETURNING *;
`;
export const createChain = async (chainDoc: Chain): Promise<Chain> => {
  const res = await dbQuery(createChainSql, [
    chainDoc.chainId,
    chainDoc.blockHeight,
  ]);
  return res.rows[0];
};

const updateChainSql = `
UPDATE "Chain" SET "blockHeight" = $2 WHERE "chainId" = $1;
`;
export const updateChain = async (chainDoc: Chain): Promise<void> => {
  await dbQuery(updateChainSql, [chainDoc.chainId, chainDoc.blockHeight]);
};
