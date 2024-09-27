import { pool, withTransaction, dbQuery } from "./client";

const getTokenNameSql = `
SELECT name FROM "Token" WHERE id = $1;
`;
export const getTokenName = async (id: string): Promise<string | undefined> => {
  try {
    const res = await pool.query(getTokenNameSql, [id]);
    return res.rows[0]?.name;
  } catch (error) {
    throw error;
  }
};

export type TokenTransaction = {
  from: string;
  to: string;
  amount: bigint;
  tokenId: string;
};

const createTokenTransactionSql = `
INSERT INTO "TokenTransaction" ("from", "to", amount, "tokenId") VALUES ($1, $2, $3, $4);
`;
export const createTokenTransaction = async (
  t: TokenTransaction
): Promise<void> => {
  try {
    await dbQuery(createTokenTransactionSql, [
      t.from,
      t.to,
      t.amount,
      t.tokenId,
    ]);
  } catch (error) {
    throw error;
  }
};

const getTokenClassContractAddressSql = `
SELECT "contractAddress" FROM "TokenClass" WHERE "contractAddress" = $1;
`;
export const getTokenClassContractAddress = async (
  contractAddress: string
): Promise<string | undefined> => {
  try {
    const res = await pool.query(getTokenClassContractAddressSql, [
      contractAddress,
    ]);
    return res.rows[0]?.contractAddress;
  } catch (error) {
    throw error;
  }
};

export type TokenClass = {
  contractAddress: string;
  minter: string;
  class: string;
  name: string;
  description: string;
  image: string;
  type: string;
  cap: bigint;
  supply: bigint;
  paused: boolean;
  stopped: boolean;
  retired?: TokenRetired[];
  cancelled?: TokenCancelled[];
};

const createTokenClassSql = `
INSERT INTO "public"."TokenClass" ( "contractAddress", "minter", "class", "name", "description", "image", "type", "cap", "supply", "paused", "stopped")
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 );
`;
export const createTokenClass = async (p: TokenClass): Promise<void> => {
  try {
    await dbQuery(createTokenClassSql, [
      p.contractAddress,
      p.minter,
      p.class,
      p.name,
      p.description,
      p.image,
      p.type,
      p.cap,
      p.supply,
      p.paused,
      p.stopped,
    ]);
  } catch (error) {
    throw error;
  }
};

const updateTokenClassSql = `
UPDATE "public"."TokenClass" SET
	         "minter" = $1,
	          "class" = $2,
	           "name" = $3,
	    "description" = $4,
	          "image" = $5,
	           "type" = $6,
	            "cap" = $7,
	         "supply" = $8,
	         "paused" = $9,
	        "stopped" = $10
WHERE
	"contractAddress" = $11;
`;
// TODO: UPDATE to maybe use other events from chain for updating retired and cancelled, as this very inefficient
export const updateTokenClass = async (p: TokenClass): Promise<void> => {
  try {
    await dbQuery(updateTokenClassSql, [
      p.minter,
      p.class,
      p.name,
      p.description,
      p.image,
      p.type,
      p.cap,
      p.supply,
      p.paused,
      p.stopped,
      p.contractAddress,
    ]);

    if (p.retired?.length) {
      await dbQuery(deleteTokenRetiredSql, [p.name]);
      await dbQuery(createTokenRetiredSql, [JSON.stringify(p.retired), p.name]);
    }

    if (p.cancelled?.length) {
      await dbQuery(deleteTokenCancelledSql, [p.name]);
      await dbQuery(createTokenCancelledSql, [
        JSON.stringify(p.cancelled),
        p.name,
      ]);
    }
  } catch (error) {
    throw error;
  }
};

export type TokenRetired = {
  id: string;
  reason: string;
  jurisdiction: string;
  amount: string; // bigint in db, but using string here as it is a jsonb function on server that parses it to bigint
  owner: string;
};

const deleteTokenRetiredSql = `
DELETE FROM "TokenRetired" WHERE "name" = $1;
`;
const createTokenRetiredSql = `
INSERT INTO "public"."TokenRetired" ( "id", "reason", "jurisdiction", "amount", "owner", "name")
SELECT tr.id, tr.reason, tr.jurisdiction, tr.amount, tr.owner, $2
FROM jsonb_to_recordset($1) AS tr(id text, reason text, jurisdiction text, amount bigint, owner text);
`;

export type TokenCancelled = {
  id: string;
  reason: string;
  amount: string; // bigint in db, but using string here as it is a jsonb function on server that parses it to bigint
  owner: string;
};

const deleteTokenCancelledSql = `
DELETE FROM "TokenCancelled" WHERE "name" = $1;
`;
const createTokenCancelledSql = `
INSERT INTO "public"."TokenCancelled" ( "id", "reason", "amount", "owner", "name")
SELECT tc.id, tc.reason, tc.amount, tc.owner, $2
FROM jsonb_to_recordset($1) AS tc(id text, reason text, amount bigint, owner text);
`;

export type Token = {
  id: string;
  index: string;
  name: string;
  collection: string;
  tokenData?: TokenData[];
};

const createTokenSql = `
INSERT INTO "public"."Token" ( "id", "index", "name", "collection")
VALUES ( $1, $2, $3, $4 );
`;
export const createToken = async (p: Token): Promise<void> => {
  try {
    await dbQuery(createTokenSql, [p.id, p.index, p.name, p.collection]);

    if (p.tokenData?.length) {
      await dbQuery(createTokenDataSql, [JSON.stringify(p.tokenData), p.id]);
    }
  } catch (error) {
    throw error;
  }
};

export type TokenData = {
  uri: string;
  encrypted: boolean;
  proof: string;
  type: string;
  id: string;
};

const createTokenDataSql = `
INSERT INTO "public"."TokenData" ( "uri", "encrypted", "proof", "type", "id", "tokenId")
SELECT td.uri, td.encrypted, td.proof, td.type, td.id, $2
FROM jsonb_to_recordset($1) AS td(uri text, encrypted boolean, proof text, type text, id text);
`;

export type TokenTransactionWithToken = TokenTransaction & {
  name: string;
  collection: string;
};

const getTokenTransactionSql = `
SELECT tt."from", tt."to", tt."amount", tt."tokenId",
       t."name", t."collection"
FROM "TokenTransaction" tt
LEFT JOIN "Token" t ON tt."tokenId" = t."id"
WHERE (tt."from" = $1 OR tt."to" = $1)
AND ($2::text IS NULL OR t."name" = $2);
`;
export const getTokenTransaction = async (
  address: string,
  name?: string
): Promise<TokenTransactionWithToken[]> => {
  try {
    // const start = Date.now();
    const res = await pool.query(getTokenTransactionSql, [address, name]);
    // console.log("executed getTokenTransaction query", {
    //   duration: Date.now() - start,
    // });
    return res.rows;
  } catch (error) {
    throw error;
  }
};

// TODO: check performance for IN vs ANY
const getTokenRetiredAmountSql = `
SELECT "id", SUM("amount")::bigint AS "amount"
FROM "TokenRetired"
WHERE "id" = ANY($1::text[])
GROUP BY "id";
`;
export const getTokenRetiredAmountSUM = async (
  ids: string[]
): Promise<{ id: string; amount: bigint }[]> => {
  try {
    const res = await pool.query(getTokenRetiredAmountSql, [ids]);
    return res.rows;
  } catch (error) {
    throw error;
  }
};

const getTokenClassSql = `
SELECT "contractAddress", "description", "image"
FROM "TokenClass"
WHERE "name" = $1;
`;
export const getTokenClass = async (name: string): Promise<TokenClass> => {
  try {
    const res = await pool.query(getTokenClassSql, [name]);
    return res.rows[0];
  } catch (error) {
    throw error;
  }
};

const getAccountTokensSql = `
  WITH token_data AS (
    SELECT
      t.name,
      tc."contractAddress",
      tc.description,
      tc.image,
      tt."tokenId",
      t.collection,
      SUM(CASE WHEN tt."to" = $1 THEN tt.amount ELSE -tt.amount END) AS amount,
      SUM(CASE WHEN tt."from" IS NULL THEN tt.amount ELSE 0 END) AS minted,
      SUM(CASE WHEN tt."to" IS NULL THEN tt.amount ELSE 0 END) AS retired
    FROM
      "TokenTransaction" tt
    LEFT JOIN
      "Token" t ON tt."tokenId" = t.id
    LEFT JOIN
      "TokenClass" tc ON t.name = tc.name
    WHERE
      ($2::text IS NULL OR t.name = $2)
      AND (tt."from" = $1 OR tt."to" = $1)
    GROUP BY
      t.name, tc."contractAddress", tc.description, tc.image, tt."tokenId", t.collection
  )
  SELECT *
  FROM token_data
  WHERE ($3::boolean IS FALSE OR amount <> 0 OR minted <> 0 OR retired <> 0);
`;

export const getAccountTokensFromDb = async (
  address: string,
  name?: string,
  allEntityRetired?: boolean
): Promise<any[]> => {
  try {
    const start = Date.now();
    const res = await pool.query(getAccountTokensSql, [
      address,
      name,
      allEntityRetired,
    ]);
    console.log("executed getAccountTokensFromDb query", {
      duration: Date.now() - start,
    });
    return res.rows;
  } catch (error) {
    throw error;
  }
};
