-- Up Migration

-- CreateTable
CREATE TABLE ixo_swap (
    "address" TEXT NOT NULL PRIMARY KEY,
    "lp_address" TEXT NOT NULL,
    "token_1155_denom" TEXT NOT NULL,
    "token_1155_reserve" BIGINT NOT NULL,
    "token_2_denom" TEXT NOT NULL,
    "token_2_reserve" BIGINT NOT NULL,
    "protocol_fee_recipient" TEXT NOT NULL,
    "protocol_fee_percent" TEXT NOT NULL,
    "lp_fee_percent" TEXT NOT NULL,
    "max_slippage_percent" TEXT NOT NULL,
    "frozen" BOOLEAN NOT NULL,
    "owner" TEXT NOT NULL,
    "pending_owner" TEXT
);

-- CreateTable
CREATE TABLE ixo_swap_price_history (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL REFERENCES ixo_swap(address),
    "timestamp" TIMESTAMP(3) NOT NULL,
    "token_1155_price" NUMERIC NOT NULL, -- price of token_1155 in terms of token_2
    "token_2_price" NUMERIC NOT NULL, -- price of token_2 in terms of token_1155
    UNIQUE ("timestamp", "address")
);

CREATE INDEX idx_price_history_timestamp ON ixo_swap_price_history ("timestamp");

-- Down Migration
