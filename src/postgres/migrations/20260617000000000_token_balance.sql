-- Up Migration
--
-- Running per-(address, tokenId) token balances.
--
-- "TokenTransaction" is an append-only ledger. Reading an address's holdings
-- previously meant scanning + SUM-ing every transaction that address ever
-- touched (see getAccountTokensSql / getAccountTokens in src/postgres/token.ts
-- and src/handlers/token_handler.ts) — an O(transactions) cost that grows
-- without bound as the ledger does, whether done via a SQL CTE or PostGraphile
-- aggregates.
--
-- This table keeps a materialised net balance that is updated incrementally in
-- the same transaction that writes each TokenTransaction row (see
-- createTokenTransaction in src/postgres/token.ts). Reading an address's full
-- holdings becomes a single index lookup whose cost is O(distinct tokens held
-- by that address), independent of total ledger size.
--
-- Balance semantics mirror the ledger: a row's `to` is credited and its `from`
-- is debited. `from`/`to` are EMPTY STRINGS (not NULL) for mints/retires
-- respectively — getWasmAttr() returns "" when an attribute is absent — so the
-- empty side is skipped. Self-transfers (from = to) are already filtered out
-- before a TokenTransaction is ever written, so there is no double-count.
--
-- A row exists iff the address currently holds the token: balances that net to
-- zero are deleted (see applyTokenBalanceDelta in src/postgres/token.ts) and
-- excluded from the backfill, so clients never need to filter zeros.
--
-- `amount` is BIGINT to match TokenTransaction.amount. A single address's
-- balance for a token is bounded by that token's total supply, which the chain
-- itself tracks as a uint64 (TokenClass.supply / .cap are BIGINT), so a balance
-- cannot exceed BIGINT range by construction.
CREATE TABLE "TokenBalance" (
    "address" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "amount"  BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "TokenBalance_pkey" PRIMARY KEY ("address", "tokenId"),
    CONSTRAINT "TokenBalance_tokenId_fkey" FOREIGN KEY ("tokenId")
        REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- No separate index on ("address") is needed: the primary-key btree leads with
-- "address", so `WHERE "address" = $1` (the only read pattern) is already
-- served by the PK index. Adding one would only add write overhead.

-- Backfill from the existing ledger. One pass that explodes each transaction
-- into a (+amount to recipient) and (-amount from sender) delta, excluding the
-- empty side, then nets them per (address, tokenId).
INSERT INTO "TokenBalance" ("address", "tokenId", "amount")
SELECT addr, "tokenId", SUM(delta)::bigint
FROM (
    SELECT "to"   AS addr, "tokenId",  "amount" AS delta
      FROM "TokenTransaction" WHERE "to"   <> ''
    UNION ALL
    SELECT "from" AS addr, "tokenId", -"amount" AS delta
      FROM "TokenTransaction" WHERE "from" <> ''
) deltas
GROUP BY addr, "tokenId"
HAVING SUM(delta) <> 0;

-- Down Migration
DROP TABLE IF EXISTS "TokenBalance";
