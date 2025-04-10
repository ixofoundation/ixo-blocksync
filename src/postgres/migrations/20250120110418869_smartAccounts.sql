-- Up Migration

-- CreateTable
CREATE TABLE "smart_account_authenticator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "config" JSONB, -- this is the arbitrary jsonb field for the authenticator config
    "key_id" TEXT -- this is the passkey id for the authenticator,if it is an authn verification authenticator
);

CREATE INDEX idx_smart_account_authenticator_address ON "smart_account_authenticator" ("address");


-- Down Migration
DROP TABLE "smart_account_authenticator";