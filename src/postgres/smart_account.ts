import { dbQuery } from "./client";

// Writes here MUST ride the per-block transaction (dbQuery routes through
// currentPool). A direct pool.query autocommits outside it — on mainnet
// Oct 2 2026 that orphaned two authenticator rows when the surrounding
// block transaction rolled back, and every re-run of the block then died
// on the duplicate key: a permanent crash loop until the rows were
// hand-deleted. ON CONFLICT DO NOTHING is the belt-and-braces for any
// orphan that still exists from before this fix.
const addAuthenticatorSql = `
INSERT INTO "public"."smart_account_authenticator"
("id", "type", "address", "config", "key_id")
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT DO NOTHING;
`;
export const addAuthenticator = async (
  id: string,
  type: string,
  address: string,
  config?: any,
  key_id?: string
): Promise<void> => {
  await dbQuery(addAuthenticatorSql, [id, type, address, config, key_id]);
};

const removeAuthenticatorSql = `
UPDATE "public"."smart_account_authenticator"
SET "removed" = true
WHERE "id" = $1 AND "address" = $2;
`;
export const removeAuthenticator = async (
  id: string,
  address: string
): Promise<void> => {
  await dbQuery(removeAuthenticatorSql, [id, address]);
};
