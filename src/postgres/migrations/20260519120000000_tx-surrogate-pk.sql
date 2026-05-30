-- Up Migration
-- Switch Transaction PK to surrogate `id`. Same hash can legitimately appear
-- in multiple blocks (and theoretically multiple times in the same block) when
-- cosmos-sdk includes failed seq-mismatch txs and the bytes get re-broadcast.
-- FK constraint names are preserved so the PostGraphile-generated relation
-- names (`transactionByTransactionHash`, `messagesByTransactionHash`) remain
-- after a smart-tag rename (see smart_tags_plugin.ts).

-- Step 1: Add surrogate id and txIndex
ALTER TABLE "Transaction" ADD COLUMN "id" SERIAL;
ALTER TABLE "Transaction" ADD COLUMN "txIndex" INTEGER NOT NULL DEFAULT 0;

UPDATE "Transaction" SET "txIndex" = sub.rn
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "height" ORDER BY "id") - 1 AS rn
  FROM "Transaction"
) sub
WHERE "Transaction"."id" = sub."id";
ALTER TABLE "Transaction" ALTER COLUMN "txIndex" DROP DEFAULT;

-- Step 2: Add transactionId to Message (nullable for backfill)
ALTER TABLE "Message" ADD COLUMN "transactionId" INTEGER;
UPDATE "Message" m SET "transactionId" = t."id"
FROM "Transaction" t WHERE m."transactionHash" = t."hash";
ALTER TABLE "Message" ALTER COLUMN "transactionId" SET NOT NULL;

-- Step 2b: Same for TransactionSigner if it exists in this deployment.
-- (TransactionSigner is created by a separate signers migration that isn't
--  present on every cluster — handle both cases defensively.)
DO $$
BEGIN
  IF to_regclass('"TransactionSigner"') IS NOT NULL THEN
    ALTER TABLE "TransactionSigner" ADD COLUMN "transactionId" INTEGER;
    UPDATE "TransactionSigner" s SET "transactionId" = t."id"
      FROM "Transaction" t WHERE s."transactionHash" = t."hash";
    ALTER TABLE "TransactionSigner" ALTER COLUMN "transactionId" SET NOT NULL;
  END IF;
END $$;

-- Step 3: Drop old FK constraints so the parent PK can be swapped.
ALTER TABLE "Message" DROP CONSTRAINT "Message_transactionHash_fkey";
DO $$
BEGIN
  IF to_regclass('"TransactionSigner"') IS NOT NULL THEN
    ALTER TABLE "TransactionSigner" DROP CONSTRAINT "TransactionSigner_transactionHash_fkey";
  END IF;
END $$;

-- Step 4: Swap Transaction PK from hash to surrogate id.
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_pkey";
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id");

-- Step 5: Re-add FK constraints (reuse original names so the smart-tag
-- config keeps the generated GraphQL relation names unchanged).
ALTER TABLE "Message" ADD CONSTRAINT "Message_transactionHash_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DO $$
BEGIN
  IF to_regclass('"TransactionSigner"') IS NOT NULL THEN
    ALTER TABLE "TransactionSigner" ADD CONSTRAINT "TransactionSigner_transactionHash_fkey"
      FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE;
    CREATE INDEX "TransactionSigner_transactionId_idx" ON "TransactionSigner"("transactionId");
  END IF;
END $$;

-- Step 6: Indexes on Transaction/Message (hash is no longer unique).
CREATE INDEX "Transaction_hash_idx" ON "Transaction"("hash");
CREATE INDEX "Transaction_hash_height_idx" ON "Transaction"("hash", "height");
CREATE INDEX "Message_transactionId_idx" ON "Message"("transactionId");

-- Down Migration
