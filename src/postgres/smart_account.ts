import { pool } from "./client";

const addAuthenticatorSql = `
INSERT INTO "public"."smart_account_authenticator"
("id", "type", "address", "config", "key_id")
VALUES ($1, $2, $3, $4, $5);
`;
export const addAuthenticator = async (
  id: string,
  type: string,
  address: string,
  config?: any,
  key_id?: string
): Promise<void> => {
  try {
    await pool.query(addAuthenticatorSql, [id, type, address, config, key_id]);
  } catch (error) {
    throw error;
  }
};

const removeAuthenticatorSql = `
DELETE FROM "public"."smart_account_authenticator"
WHERE "id" = $1 AND "address" = $2;
`;
export const removeAuthenticator = async (
  id: string,
  address: string
): Promise<void> => {
  try {
    await pool.query(removeAuthenticatorSql, [id, address]);
  } catch (error) {
    throw error;
  }
};
