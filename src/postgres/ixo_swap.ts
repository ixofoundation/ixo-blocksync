import Decimal from "decimal.js";
import { pool, withTransaction } from "./client";

export type IxoSwap = {
  address: string;
  lpAddress: string;
  token1155Denom: string;
  token1155Reserve: bigint;
  token2Denom: string;
  token2Reserve: bigint;
  protocolFeeRecipient: string;
  protocolFeePercent: string;
  lpFeePercent: string;
  maxSlippagePercent: string;
  frozen: boolean;
  owner: string;
  pendingOwner?: string | null;
};

const getIxoSwapSql = `
SELECT * FROM ixo_swap WHERE address = $1;
`;
export const getIxoSwap = async (
  address: string
): Promise<IxoSwap | undefined> => {
  try {
    const res = await pool.query(getIxoSwapSql, [address]);
    return res.rows[0];
  } catch (error) {
    throw error;
  }
};

const createIxoSwapSql = `
INSERT INTO ixo_swap ("address", "lp_address", "token_1155_denom", "token_1155_reserve", "token_2_denom", "token_2_reserve", "protocol_fee_recipient", "protocol_fee_percent", "lp_fee_percent", "max_slippage_percent", "frozen", "owner", "pending_owner") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
`;
export const createIxoSwap = async (t: IxoSwap): Promise<void> => {
  try {
    await pool.query(createIxoSwapSql, [
      t.address,
      t.lpAddress,
      t.token1155Denom,
      t.token1155Reserve,
      t.token2Denom,
      t.token2Reserve,
      t.protocolFeeRecipient,
      t.protocolFeePercent,
      t.lpFeePercent,
      t.maxSlippagePercent,
      t.frozen,
      t.owner,
      t.pendingOwner,
    ]);
  } catch (error) {
    throw error;
  }
};

const updateIxoSwapLPAddressSql = `
UPDATE ixo_swap SET lp_address = $2 WHERE address = $1;
`;
export const updateIxoSwapLPAddress = async (e: {
  address: string;
  lpAddress: string;
}): Promise<void> => {
  try {
    await pool.query(updateIxoSwapLPAddressSql, [e.address, e.lpAddress]);
  } catch (error) {
    throw error;
  }
};

const updateIxoSwapFrozenSql = `
UPDATE ixo_swap SET frozen = $2 WHERE address = $1;
`;
export const updateIxoSwapFrozen = async (e: {
  address: string;
  frozen: boolean;
}): Promise<void> => {
  try {
    await pool.query(updateIxoSwapFrozenSql, [e.address, e.frozen]);
  } catch (error) {
    throw error;
  }
};

const updateIxoSwapNewOwnerSql = `
UPDATE ixo_swap SET owner = $2, pending_owner = NULL WHERE address = $1;
`;
export const updateIxoSwapNewOwner = async (e: {
  address: string;
  owner: string;
}): Promise<void> => {
  try {
    await pool.query(updateIxoSwapNewOwnerSql, [e.address, e.owner]);
  } catch (error) {
    throw error;
  }
};

const updateIxoSwapPendingOwnerSql = `
UPDATE ixo_swap SET pending_owner = $2 WHERE address = $1;
`;
export const updateIxoSwapPendingOwner = async (e: {
  address: string;
  pendingOwner: string;
}): Promise<void> => {
  try {
    await pool.query(updateIxoSwapPendingOwnerSql, [e.address, e.pendingOwner]);
  } catch (error) {
    throw error;
  }
};

const updateIxoSwapMaxSlippagePercentSql = `
UPDATE ixo_swap SET max_slippage_percent = $2 WHERE address = $1;
`;
export const updateIxoSwapMaxSlippagePercent = async (e: {
  address: string;
  maxSlippagePercent: string;
}): Promise<void> => {
  try {
    await pool.query(updateIxoSwapMaxSlippagePercentSql, [
      e.address,
      e.maxSlippagePercent,
    ]);
  } catch (error) {
    throw error;
  }
};

const updateIxoSwapFeeSql = `
UPDATE ixo_swap SET lp_fee_percent = $2, protocol_fee_percent = $3, protocol_fee_recipient = $4 WHERE address = $1;
`;
export const updateIxoSwapFee = async (e: {
  address: string;
  lpFeePercent: string;
  protocolFeePercent: string;
  protocolFeeRecipient: string;
}): Promise<void> => {
  try {
    await pool.query(updateIxoSwapFeeSql, [
      e.address,
      e.lpFeePercent,
      e.protocolFeePercent,
      e.protocolFeeRecipient,
    ]);
  } catch (error) {
    throw error;
  }
};

const updateIxoSwapReservesSql = `
UPDATE ixo_swap SET token_1155_reserve = $2, token_2_reserve = $3 WHERE address = $1;
`;
export const updateIxoSwapReserves = async (e: {
  address: string;
  token1155Reserve: bigint;
  token2Reserve: bigint;
}): Promise<void> => {
  try {
    await pool.query(updateIxoSwapReservesSql, [
      e.address,
      e.token1155Reserve,
      e.token2Reserve,
    ]);
  } catch (error) {
    throw error;
  }
};

const insertIxoSwapPriceHistorySql = `
INSERT INTO ixo_swap_price_history ("address", "timestamp", "token_1155_price", "token_2_price")
VALUES ($1, $2, $3, $4)
ON CONFLICT("timestamp", "address") DO UPDATE SET
  "token_1155_price" = EXCLUDED."token_1155_price",
  "token_2_price" = EXCLUDED."token_2_price"
WHERE ixo_swap_price_history."address" = EXCLUDED."address" AND ixo_swap_price_history."timestamp" = EXCLUDED."timestamp";
`;
/**
 * This function does 2 things:
 * 1.1- Inserts a new row into ixo_swap_price_history table if no row with same timestamp exists
 * 1.2- Updates the token_1155_price and token_2_price columns of the ixo_swap table if a row with same timestamp exists
 * 2- Updates the ixo_swap table with the latest token_1155_reserve and token_2_reserve values
 */
const decimalZero = new Decimal(0);
export const insertIxoSwapPriceHistory = async (e: {
  address: string;
  timestamp: Date;
  token1155Reserve: string;
  token2Reserve: string;
}): Promise<void> => {
  try {
    await withTransaction(async (client) => {
      console.log("token1155Reserve: ", e.token1155Reserve);
      console.log("token2Reserve: ", e.token2Reserve);
      const token1155ReserveDecimal = new Decimal(e.token1155Reserve);
      const token2ReserveDecimal = new Decimal(e.token2Reserve);
      // safegaurd against divide by zero
      const isEitherZero =
        token1155ReserveDecimal.isZero() || token2ReserveDecimal.isZero();
      const token_1155_price = isEitherZero
        ? decimalZero
        : token2ReserveDecimal.div(token1155ReserveDecimal);
      const token_2_price = isEitherZero
        ? decimalZero
        : token1155ReserveDecimal.div(token2ReserveDecimal);
      console.log("token_1155_price: ", token_1155_price.toString());
      console.log("token_2_price: ", token_2_price.toString());
      await client.query(insertIxoSwapPriceHistorySql, [
        e.address,
        e.timestamp,
        token_1155_price.toString(),
        token_2_price.toString(),
      ]);
      await client.query(updateIxoSwapReservesSql, [
        e.address,
        e.token1155Reserve,
        e.token2Reserve,
      ]);
    });
  } catch (error) {
    throw error;
  }
};
