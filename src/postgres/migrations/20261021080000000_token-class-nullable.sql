-- Up Migration

-- A token class on chain is any string; x/token does not require it to be an
-- entity. Blocksync keeps the foreign key TokenClass.class -> Entity.id (it is
-- what gives GraphQL clients TokenClass.entityByClass and
-- Entity.tokenClassesByClass), so a class that names no indexed entity is
-- stored as NULL instead of failing the block. Seen on testnet 2026-10-21
-- (block 19847428, MsgCreateToken with class = the minter's account DID): the
-- NOT NULL + FK pair made the indexer exit on every retry and crashloop.
--
-- DROP NOT NULL is a catalog-only change (no table rewrite, no scan): safe
-- inside the ~35 s startup window in every environment.
ALTER TABLE "TokenClass" ALTER COLUMN "class" DROP NOT NULL;

-- Down Migration

-- Fails if a NULL class has been stored since; delete or backfill those rows
-- first.
ALTER TABLE "TokenClass" ALTER COLUMN "class" SET NOT NULL;
