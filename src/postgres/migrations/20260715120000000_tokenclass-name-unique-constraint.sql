-- Up Migration

-- "TokenClass"."name" is the target of three foreign keys
-- (Token/TokenRetired/TokenCancelled "name") but its uniqueness comes from a
-- Prisma-era plain UNIQUE INDEX rather than a UNIQUE CONSTRAINT. Postgres
-- accepts FKs onto a unique index, but PostGraphile 5 (ixo-blocksync-api)
-- only recognizes constraints (pg_constraint) as uniques, so the single-row
-- tokenClassByName relations fail at plan time ("combination of attributes
-- is not unique"). Promote the index to a constraint in place: instant
-- metadata-only change, the existing index is adopted (same name/OID), and
-- the dependent FKs are unaffected.
-- NOTE: ixo-blocksync-api pods must restart after this runs - the API
-- introspects the database once at boot.
ALTER TABLE "TokenClass"
  ADD CONSTRAINT "TokenClass_name_key" UNIQUE USING INDEX "TokenClass_name_key";

-- Down Migration

-- Demote back to a plain unique index. The dependent FKs must be dropped
-- first (they depend on the constraint's index) and re-added afterwards.
ALTER TABLE "Token" DROP CONSTRAINT "Token_name_fkey";
ALTER TABLE "TokenRetired" DROP CONSTRAINT "TokenRetired_name_fkey";
ALTER TABLE "TokenCancelled" DROP CONSTRAINT "TokenCancelled_name_fkey";
ALTER TABLE "TokenClass" DROP CONSTRAINT "TokenClass_name_key";
CREATE UNIQUE INDEX "TokenClass_name_key" ON "TokenClass"("name");
ALTER TABLE "Token" ADD CONSTRAINT "Token_name_fkey" FOREIGN KEY ("name") REFERENCES "TokenClass"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TokenRetired" ADD CONSTRAINT "TokenRetired_name_fkey" FOREIGN KEY ("name") REFERENCES "TokenClass"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TokenCancelled" ADD CONSTRAINT "TokenCancelled_name_fkey" FOREIGN KEY ("name") REFERENCES "TokenClass"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
