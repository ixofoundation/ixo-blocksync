-- Up Migration

-- Same case as 20261021080000000_token-class-nullable, one table over: x/token
-- does not require a token's collection to be an entity either. Testnet block
-- 19847430 (2026-10-21) minted TEAMSWALLETTEST tokens with collection = the
-- minter's account DID and tripped Token_collection_fkey right after the class
-- fix let block 19847428 through. The foreign key stays (GraphQL
-- Token.entityByCollection / Entity.tokensByCollection); a collection that
-- names no indexed entity is stored as NULL. Catalog-only change.
ALTER TABLE "Token" ALTER COLUMN "collection" DROP NOT NULL;

-- Down Migration

-- Fails if a NULL collection has been stored since; delete or backfill first.
ALTER TABLE "Token" ALTER COLUMN "collection" SET NOT NULL;
