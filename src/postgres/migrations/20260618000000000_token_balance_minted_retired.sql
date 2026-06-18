-- Up Migration
--
-- Extend "TokenBalance" with cumulative `minted` and `retired` columns so it can
-- back the full getAccountTokens primitive (per (address, tokenId): amount,
-- minted, retired) — not just the net balance. This lets the custom token
-- resolvers read a single indexed row per held token instead of scanning and
-- folding the whole TokenTransaction ledger in JS.
--
--   minted  = total ever minted TO this address for this token
--             (credit side where "from" is empty)
--   retired = total ever retired BY this address for this token
--             (debit side where "to" is empty)
--
-- Both are monotonic (only ever increase), mirroring token_handler.ts.
--
-- The original "TokenBalance" deleted any row whose net amount hit zero. With
-- minted/retired tracked, a row must survive while EITHER is non-zero (e.g. an
-- address that minted then transferred everything away: amount = 0 but
-- minted > 0). That changes which rows should exist, and the live table was
-- populated under the old amount-only rule, so we rebuild it from the ledger
-- rather than ALTER + patch.

ALTER TABLE "TokenBalance"
    ADD COLUMN "minted"  BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN "retired" BIGINT NOT NULL DEFAULT 0;

-- Rebuild from the append-only ledger. Each transaction contributes a credit
-- delta to "to" and a debit delta to "from" (empty side skipped). A mint
-- (empty "from") adds to minted on the credit side; a retire (empty "to") adds
-- to retired on the debit side.
TRUNCATE "TokenBalance";

INSERT INTO "TokenBalance" ("address", "tokenId", "amount", "minted", "retired")
SELECT addr, "tokenId",
       SUM(amount_delta)::bigint,
       SUM(minted_delta)::bigint,
       SUM(retired_delta)::bigint
FROM (
    SELECT "to" AS addr, "tokenId",
           "amount"                                  AS amount_delta,
           CASE WHEN "from" = '' THEN "amount" ELSE 0 END AS minted_delta,
           0                                         AS retired_delta
      FROM "TokenTransaction" WHERE "to" <> ''
    UNION ALL
    SELECT "from" AS addr, "tokenId",
           -"amount"                                 AS amount_delta,
           0                                         AS minted_delta,
           CASE WHEN "to" = '' THEN "amount" ELSE 0 END   AS retired_delta
      FROM "TokenTransaction" WHERE "from" <> ''
) deltas
GROUP BY addr, "tokenId"
HAVING SUM(amount_delta) <> 0 OR SUM(minted_delta) <> 0 OR SUM(retired_delta) <> 0;

-- Down Migration
--
-- Restore the amount-only invariant: drop the columns and remove rows that only
-- existed because of a non-zero minted/retired (net amount zero).
DELETE FROM "TokenBalance" WHERE "amount" = 0;
ALTER TABLE "TokenBalance" DROP COLUMN "minted", DROP COLUMN "retired";
