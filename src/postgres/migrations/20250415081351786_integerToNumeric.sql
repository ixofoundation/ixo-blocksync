-- Up Migration

-- Altering columns with type uint64 on chain to type numeric

ALTER TABLE "ClaimCollection"
    ALTER COLUMN "quota" TYPE NUMERIC USING quota::NUMERIC,
    ALTER COLUMN "count" TYPE NUMERIC USING count::NUMERIC,
    ALTER COLUMN "evaluated" TYPE NUMERIC USING evaluated::NUMERIC,
    ALTER COLUMN "approved" TYPE NUMERIC USING approved::NUMERIC,
    ALTER COLUMN "rejected" TYPE NUMERIC USING rejected::NUMERIC,
    ALTER COLUMN "disputed" TYPE NUMERIC USING disputed::NUMERIC,
    ALTER COLUMN "invalidated" TYPE NUMERIC USING invalidated::NUMERIC;

ALTER TABLE "Evaluation"
    ALTER COLUMN "reason" TYPE NUMERIC USING reason::NUMERIC;

-- Down Migration