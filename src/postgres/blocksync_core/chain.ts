import { corePool } from "./client";

export type ChainCore = {
  chainId: string;
  blockHeight: number;
};

const getChainSql = `
SELECT * FROM "ChainCore" WHERE "chainId" = $1;
`;
export const getCoreChain = async (
  chainId: string
): Promise<ChainCore | undefined> => {
  try {
    let chain = await corePool.query(getChainSql, [chainId]);
    return chain.rows[0];
  } catch (error) {
    console.error("ERROR::getCoreChain::", error);
    throw error;
  }
};
