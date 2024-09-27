-- Migration Script to add 'volume' column to ixo_swap_price_history

-- Up Migration

-- Add volume fields to the ixo_swap_price_history table
ALTER TABLE ixo_swap_price_history
ADD COLUMN token_1155_volume NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN token_2_volume NUMERIC NOT NULL DEFAULT 0;

-- Down Migration
ALTER TABLE ixo_swap_price_history
DROP COLUMN token_1155_volume,
DROP COLUMN token_2_volume;