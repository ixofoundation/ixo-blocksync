-- Up Migration

CREATE TABLE IF NOT EXISTS "TokenConflict" (
    "aid" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "collection" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),

    CONSTRAINT "TokenConflict_pkey" PRIMARY KEY ("aid")
);
CREATE INDEX IF NOT EXISTS "TokenConflict_id_idx" ON "TokenConflict" ("id");

-- Down Migration

DROP TABLE IF EXISTS "TokenConflict";
