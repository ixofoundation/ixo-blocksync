-- Up Migration
-- Add new fields for claims module intents feature (added in later chain upgrade)

-- ClaimCollection: escrow account and intents option
ALTER TABLE "ClaimCollection" ADD COLUMN "escrowAccount" TEXT;
ALTER TABLE "ClaimCollection" ADD COLUMN "intents" INTEGER;

-- Claim: intent-related fields and custom payment amounts
ALTER TABLE "Claim" ADD COLUMN "useIntent" BOOLEAN;
ALTER TABLE "Claim" ADD COLUMN "amount" JSONB;
ALTER TABLE "Claim" ADD COLUMN "cw20Payment" JSONB;
ALTER TABLE "Claim" ADD COLUMN "cw1155Payment" JSONB;
ALTER TABLE "Claim" ADD COLUMN "cw1155IntentPayment" JSONB;

-- Evaluation: custom payment amounts (amount already exists)
ALTER TABLE "Evaluation" ADD COLUMN "cw20Payment" JSONB;
ALTER TABLE "Evaluation" ADD COLUMN "cw1155Payment" JSONB;
ALTER TABLE "Evaluation" ADD COLUMN "cw1155IntentPayment" JSONB;

-- Down Migration
-- ALTER TABLE "Evaluation" DROP COLUMN "cw1155IntentPayment";
-- ALTER TABLE "Evaluation" DROP COLUMN "cw1155Payment";
-- ALTER TABLE "Evaluation" DROP COLUMN "cw20Payment";
-- ALTER TABLE "Claim" DROP COLUMN "cw1155IntentPayment";
-- ALTER TABLE "Claim" DROP COLUMN "cw1155Payment";
-- ALTER TABLE "Claim" DROP COLUMN "cw20Payment";
-- ALTER TABLE "Claim" DROP COLUMN "amount";
-- ALTER TABLE "Claim" DROP COLUMN "useIntent";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "intents";
-- ALTER TABLE "ClaimCollection" DROP COLUMN "escrowAccount";

