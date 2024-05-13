import { pool } from "./client";

export type Chain = {
  chainId: string;
  blockHeight: number;
};

const getChainSql = `
SELECT * FROM "Chain" WHERE "chainId" = $1;
`;
export const getChain = async (chainId: string): Promise<Chain | undefined> => {
  try {
    const res = await pool.query(getChainSql, [chainId]);
    return res.rows[0];
  } catch (error) {
    throw error;
  }
};

const createChainSql = `
INSERT INTO "Chain" ("chainId", "blockHeight") VALUES ($1, $2) RETURNING *;
`;
export const createChain = async (chainDoc: Chain): Promise<Chain> => {
  try {
    const res = await pool.query(createChainSql, [
      chainDoc.chainId,
      chainDoc.blockHeight,
    ]);
    return res.rows[0];
  } catch (error) {
    throw error;
  }
};

const updateChainSql = `
UPDATE "Chain" SET "blockHeight" = $2 WHERE "chainId" = $1;
`;
export const updateChain = async (chainDoc: Chain): Promise<void> => {
  try {
    await pool.query(updateChainSql, [chainDoc.chainId, chainDoc.blockHeight]);
  } catch (error) {
    throw error;
  }
};
