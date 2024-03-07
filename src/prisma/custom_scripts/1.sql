
-- 1. Add new BIGINT columns
ALTER TABLE "TokenCancelled" ADD COLUMN "new_amount" BIGINT;
-- 2. Migrate data (Assuming the data is already in a valid format for casting)
UPDATE "TokenCancelled" SET "new_amount" = CAST("amount" AS BIGINT);
-- After verifying the data migration, proceed with the next steps:
-- 3. Drop old columns
ALTER TABLE "TokenCancelled" DROP COLUMN "amount";
-- 4. Rename new columns to original
ALTER TABLE "TokenCancelled" RENAME COLUMN "new_amount" TO "amount";

-- 1. Add new BIGINT columns
ALTER TABLE "TokenRetired" ADD COLUMN "new_amount" BIGINT;
-- 2. Migrate data (Assuming the data is already in a valid format for casting)
UPDATE "TokenRetired" SET "new_amount" = CAST("amount" AS BIGINT);
-- After verifying the data migration, proceed with the next steps:
-- 3. Drop old columns
ALTER TABLE "TokenRetired" DROP COLUMN "amount";
-- 4. Rename new columns to original
ALTER TABLE "TokenRetired" RENAME COLUMN "new_amount" TO "amount";

-- 1. Add new BIGINT columns
ALTER TABLE "TokenTransaction" ADD COLUMN "new_amount" BIGINT;
-- 2. Migrate data (Assuming the data is already in a valid format for casting)
UPDATE "TokenTransaction" SET "new_amount" = CAST("amount" AS BIGINT);
-- After verifying the data migration, proceed with the next steps:
-- 3. Drop old columns
ALTER TABLE "TokenTransaction" DROP COLUMN "amount";
-- 4. Rename new columns to original
ALTER TABLE "TokenTransaction" RENAME COLUMN "new_amount" TO "amount";

-- 1. Add new BIGINT columns
ALTER TABLE "TokenClass" ADD COLUMN "new_cap" BIGINT;
-- 2. Migrate data (Assuming the data is already in a valid format for casting)
UPDATE "TokenClass" SET "new_cap" = CAST("cap" AS BIGINT);
-- After verifying the data migration, proceed with the next steps:
-- 3. Drop old columns
ALTER TABLE "TokenClass" DROP COLUMN "cap";
-- 4. Rename new columns to original
ALTER TABLE "TokenClass" RENAME COLUMN "new_cap" TO "cap";

-- 1. Add new BIGINT columns
ALTER TABLE "TokenClass" ADD COLUMN "new_supply" BIGINT;
-- 2. Migrate data (Assuming the data is already in a valid format for casting)
UPDATE "TokenClass" SET "new_supply" = CAST("supply" AS BIGINT);
-- After verifying the data migration, proceed with the next steps:
-- 3. Drop old columns
ALTER TABLE "TokenClass" DROP COLUMN "supply";
-- 4. Rename new columns to original
ALTER TABLE "TokenClass" RENAME COLUMN "new_supply" TO "supply";





-- -- AlterTable
-- ALTER TABLE "TokenClass" DROP COLUMN "cap",
-- ADD COLUMN     "cap" BIGINT NOT NULL,
-- DROP COLUMN "supply",
-- ADD COLUMN     "supply" BIGINT NOT NULL;
