import { pool, withTransaction, dbQuery } from "./client";

const getTokenNameSql = `
SELECT name FROM "Token" WHERE id = $1;
`;
export const getTokenName = async (id: string): Promise<string | undefined> => {
  const res = await pool.query(getTokenNameSql, [id]);
  return res.rows[0]?.name;
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

// Accumulate signed deltas onto an address's running totals for a token, and
// return the resulting row. Inserts on first sight, otherwise adds to the
// existing totals. Runs on the same connection (currentPool) as the
// TokenTransaction insert, so the ledger row and the balance update commit
// atomically within the per-block transaction.
//
//   amount  = net holdings (credits - debits)
//   minted  = cumulative minted TO this address (monotonic)
//   retired = cumulative retired BY this address (monotonic)
const upsertTokenBalanceSql = `
INSERT INTO "TokenBalance" ("address", "tokenId", "amount", "minted", "retired")
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT ("address", "tokenId")
DO UPDATE SET
  "amount"  = "TokenBalance"."amount"  + EXCLUDED."amount",
  "minted"  = "TokenBalance"."minted"  + EXCLUDED."minted",
  "retired" = "TokenBalance"."retired" + EXCLUDED."retired"
RETURNING "amount", "minted", "retired";
`;

const deleteTokenBalanceSql = `
DELETE FROM "TokenBalance" WHERE "address" = $1 AND "tokenId" = $2;
`;

// A row in "TokenBalance" means the address has a non-trivial relationship with
// the token, matching token_handler's keep-condition exactly: a row is removed
// only when amount, minted AND retired are all zero (a pure pass-through that
// netted to nothing). minted/retired are monotonic, so this delete only fires
// for transfer-through accounts that drained to zero.
const applyTokenBalanceDelta = async (
  address: string,
  tokenId: string,
  amount: bigint,
  minted: bigint,
  retired: bigint
): Promise<void> => {
  const res = await dbQuery(upsertTokenBalanceSql, [
    address,
    tokenId,
    amount,
    minted,
    retired,
  ]);
  const row = res.rows[0];
  if (
    BigInt(row.amount) === 0n &&
    BigInt(row.minted) === 0n &&
    BigInt(row.retired) === 0n
  ) {
    await dbQuery(deleteTokenBalanceSql, [address, tokenId]);
  }
};

export const createTokenTransaction = async (
  t: TokenTransaction
): Promise<void> => {
  await dbQuery(createTokenTransactionSql, [t.from, t.to, t.amount, t.tokenId]);

  // Keep "TokenBalance" in sync with the ledger: credit the recipient, debit
  // the sender. `from`/`to` are empty strings for mints/retires, so the empty
  // side is skipped. Self-transfers never reach here (filtered upstream).
  if (t.to) {
    // empty `from` => this credit is a mint to the recipient
    const minted = t.from ? 0n : t.amount;
    await applyTokenBalanceDelta(t.to, t.tokenId, t.amount, minted, 0n);
  }
  if (t.from) {
    // empty `to` => this debit is a retire by the sender
    const retired = t.to ? 0n : t.amount;
    await applyTokenBalanceDelta(t.from, t.tokenId, -t.amount, 0n, retired);
  }
};

export type AccountTokenBalance = {
  tokenId: string;
  amount: bigint;
  minted: bigint;
  retired: bigint;
  name: string;
  collection: string;
  contractAddress: string;
  description: string;
  image: string;
};

// Single indexed read of an address's full holdings, joined to the token /
// token-class metadata the resolvers need. Replaces scanning + folding the
// whole TokenTransaction ledger: cost is O(distinct tokens held), and every
// row is already a "real" entry (zero rows are never stored).
const getAccountTokenBalancesSql = `
SELECT b."address", b."tokenId", b."amount", b."minted", b."retired",
       t."name", t."collection",
       tc."contractAddress", tc."description", tc."image"
FROM "TokenBalance" b
JOIN "Token" t       ON t."id"   = b."tokenId"
JOIN "TokenClass" tc ON tc."name" = t."name"
WHERE b."address" = ANY($1::text[])
  AND ($2::text IS NULL OR t."name" = $2);
`;

// Batch variant: resolves many addresses in one round-trip (for the entity /
// collection fan-out resolvers). Returns rows for all addresses; the caller
// groups by address.
export const getAccountTokenBalancesBatch = async (
  addresses: string[],
  name?: string | null
): Promise<(AccountTokenBalance & { address: string })[]> => {
  if (!addresses.length) return [];
  // Read on the shared pool (not dbQuery/currentPool, which is reserved for the
  // sync block transaction), matching the other read helpers in this file.
  const res = await pool.query(getAccountTokenBalancesSql, [
    addresses,
    name ?? null,
  ]);
  return res.rows;
};

export const getAccountTokenBalances = async (
  address: string,
  name?: string | null
): Promise<AccountTokenBalance[]> => {
  if (!address) return [];
  const res = await pool.query(getAccountTokenBalancesSql, [
    [address],
    name ?? null,
  ]);
  return res.rows;
};

const getTokenClassContractAddressSql = `
SELECT "contractAddress" FROM "TokenClass" WHERE "contractAddress" = $1;
`;
export const getTokenClassContractAddress = async (
  contractAddress: string
): Promise<string | undefined> => {
  const res = await pool.query(getTokenClassContractAddressSql, [
    contractAddress,
  ]);
  return res.rows[0]?.contractAddress;
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
  await dbQuery(createTokenSql, [p.id, p.index, p.name, p.collection]);

  if (p.tokenData?.length) {
    await dbQuery(createTokenDataSql, [JSON.stringify(p.tokenData), p.id]);
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
  // const start = Date.now();
  const res = await pool.query(getTokenTransactionSql, [address, name]);
  // console.log("executed getTokenTransaction query", {
  //   duration: Date.now() - start,
  // });
  return res.rows;
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
  const res = await pool.query(getTokenRetiredAmountSql, [ids]);
  return res.rows;
};

const getTokenClassSql = `
SELECT "contractAddress", "description", "image"
FROM "TokenClass"
WHERE "name" = $1;
`;
export const getTokenClass = async (name: string): Promise<TokenClass> => {
  const res = await pool.query(getTokenClassSql, [name]);
  return res.rows[0];
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
};
