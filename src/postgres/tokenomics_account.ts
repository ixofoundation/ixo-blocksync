import { pool } from "./client";

export type TokenomicsAccount = {
  address: string;
  accountNumber: number;
  availBalance: bigint;
  delegationsBalance: bigint;
  rewardsBalance: bigint;
  totalBalance: bigint;
  type?: string;
};

const upsertTokenomicsAccountSql = `
INSERT INTO "public"."TokenomicsAccount" ( "address", "accountNumber", "availBalance", "delegationsBalance", "rewardsBalance", "totalBalance", "type") 
VALUES ( $1, $2, $3, $4, $5, $6, $7 )
ON CONFLICT("address") DO UPDATE SET
  "accountNumber" = EXCLUDED."accountNumber",
  "availBalance" = EXCLUDED."availBalance",
  "delegationsBalance" = EXCLUDED."delegationsBalance",
  "rewardsBalance" = EXCLUDED."rewardsBalance",
  "totalBalance" = EXCLUDED."totalBalance",
  "type" = EXCLUDED."type"
WHERE "TokenomicsAccount"."address" = EXCLUDED."address";
`;
export const upsertTokenomicsAccount = async (
  p: TokenomicsAccount
): Promise<void> => {
  try {
    await pool.query(upsertTokenomicsAccountSql, [
      p.address,
      p.accountNumber,
      p.availBalance,
      p.delegationsBalance,
      p.rewardsBalance,
      p.totalBalance,
      p.type,
    ]);
  } catch (error) {
    throw error;
  }
};
