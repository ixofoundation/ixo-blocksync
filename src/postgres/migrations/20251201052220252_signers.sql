-- Up Migration

-- Add feePayer to Transaction
ALTER TABLE "Transaction" ADD COLUMN "feePayer" TEXT;

-- Add 'removed' field to smart_account_authenticator to track removal without deleting historical data
ALTER TABLE "smart_account_authenticator" ADD COLUMN "removed" BOOLEAN NOT NULL DEFAULT false;

-- Create TransactionSigner table
CREATE TABLE "TransactionSigner" (
    "id" SERIAL PRIMARY KEY,
    "transactionHash" TEXT NOT NULL,
    "signerAddress" TEXT NOT NULL,
    "messageIndex" INTEGER NOT NULL,
    "authenticatorId" TEXT,
    "sequence" INTEGER,

    CONSTRAINT "TransactionSigner_transactionHash_fkey"
        FOREIGN KEY ("transactionHash") REFERENCES "Transaction"("hash") ON DELETE CASCADE,
    CONSTRAINT "TransactionSigner_authenticatorId_fkey"
        FOREIGN KEY ("authenticatorId") REFERENCES "smart_account_authenticator"("id") ON DELETE SET NULL
);

CREATE INDEX "TransactionSigner_transactionHash_idx" ON "TransactionSigner"("transactionHash");
CREATE INDEX "TransactionSigner_signerAddress_idx" ON "TransactionSigner"("signerAddress");
CREATE INDEX "TransactionSigner_authenticatorId_idx" ON "TransactionSigner"("authenticatorId") WHERE "authenticatorId" IS NOT NULL;

-- Add index on Transaction.feePayer for efficient lookups
CREATE INDEX "Transaction_feePayer_idx" ON "Transaction"("feePayer") WHERE "feePayer" IS NOT NULL;

-- Add index on smart_account_authenticator.removed for filtering active authenticators
CREATE INDEX "smart_account_authenticator_removed_idx" ON "smart_account_authenticator"("removed") WHERE "removed" = false;

-- Down Migration
-- DROP INDEX "smart_account_authenticator_removed_idx";
-- DROP INDEX "Transaction_feePayer_idx";
-- DROP INDEX "TransactionSigner_authenticatorId_idx";
-- DROP INDEX "TransactionSigner_signerAddress_idx";
-- DROP INDEX "TransactionSigner_transactionHash_idx";
-- DROP TABLE "TransactionSigner";
-- ALTER TABLE "smart_account_authenticator" DROP COLUMN "removed_at";
-- ALTER TABLE "smart_account_authenticator" DROP COLUMN "removed";
-- ALTER TABLE "Transaction" DROP COLUMN "feePayer";


