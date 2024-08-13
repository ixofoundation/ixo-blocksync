import { pool } from "./client";

export type Bond = {
  bondDid: string;
  state: string;
  token: string;
  name: string;
  description: string;
  functionType: string;
  functionParameters: any; // JSON
  creatorDid: string;
  controllerDid: string;
  reserveTokens: string[];
  txFeePercentage: string;
  exitFeePercentage: string;
  feeAddress: string;
  reserveWithdrawalAddress: string;
  maxSupply?: any; // JSON
  orderQuantityLimits: any; // JSON
  sanityRate: string;
  sanityMarginPercentage: string;
  currentSupply?: any; // JSON
  currentReserve: any; // JSON
  availableReserve: any; // JSON
  currentOutcomePaymentReserve: any; // JSON
  allowSells: boolean;
  allowReserveWithdrawals: boolean;
  alphaBond: boolean;
  batchBlocks: string;
  outcomePayment: string;
  oracleDid: string;
};

const createBondSql = `
INSERT INTO "public"."Bond" ( "bondDid", "state", "token", "name", "description", "functionType", "functionParameters", "creatorDid", "controllerDid", "reserveTokens", "txFeePercentage", "exitFeePercentage", "feeAddress", "reserveWithdrawalAddress", "maxSupply", "orderQuantityLimits", "sanityRate", "sanityMarginPercentage", "currentSupply", "currentReserve", "availableReserve", "currentOutcomePaymentReserve", "allowSells", "allowReserveWithdrawals", "alphaBond", "batchBlocks", "outcomePayment", "oracleDid") 
VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28 );
`;
export const createBond = async (p: Bond): Promise<void> => {
  try {
    await pool.query(createBondSql, [
      p.bondDid,
      p.state,
      p.token,
      p.name,
      p.description,
      p.functionType,
      JSON.stringify(p.functionParameters),
      p.creatorDid,
      p.controllerDid,
      p.reserveTokens,
      p.txFeePercentage,
      p.exitFeePercentage,
      p.feeAddress,
      p.reserveWithdrawalAddress,
      JSON.stringify(p.maxSupply),
      JSON.stringify(p.orderQuantityLimits),
      p.sanityRate,
      p.sanityMarginPercentage,
      JSON.stringify(p.currentSupply),
      JSON.stringify(p.currentReserve),
      JSON.stringify(p.availableReserve),
      JSON.stringify(p.currentOutcomePaymentReserve),
      p.allowSells,
      p.allowReserveWithdrawals,
      p.alphaBond,
      p.batchBlocks,
      p.outcomePayment,
      p.oracleDid,
    ]);
  } catch (error) {
    throw error;
  }
};

const updateBondSql = `
UPDATE "public"."Bond" SET
	                       "state" = $1,
	                       "token" = $2,
	                        "name" = $3,
	                 "description" = $4,
	                "functionType" = $5,
	          "functionParameters" = $6,
	                  "creatorDid" = $7,
	               "controllerDid" = $8,
	               "reserveTokens" = $9,
	             "txFeePercentage" = $10,
	           "exitFeePercentage" = $11,
	                  "feeAddress" = $12,
	    "reserveWithdrawalAddress" = $13,
	                   "maxSupply" = $14,
	         "orderQuantityLimits" = $15,
	                  "sanityRate" = $16,
	      "sanityMarginPercentage" = $17,
	               "currentSupply" = $18,
	              "currentReserve" = $19,
	            "availableReserve" = $20,
	"currentOutcomePaymentReserve" = $21,
	                  "allowSells" = $22,
	     "allowReserveWithdrawals" = $23,
	                   "alphaBond" = $24,
	                 "batchBlocks" = $25,
	              "outcomePayment" = $26,
	                   "oracleDid" = $27
WHERE
	                     "bondDid" = $28;
`;
export const updateBond = async (p: Bond): Promise<void> => {
  try {
    await pool.query(updateBondSql, [
      p.state,
      p.token,
      p.name,
      p.description,
      p.functionType,
      JSON.stringify(p.functionParameters),
      p.creatorDid,
      p.controllerDid,
      p.reserveTokens,
      p.txFeePercentage,
      p.exitFeePercentage,
      p.feeAddress,
      p.reserveWithdrawalAddress,
      JSON.stringify(p.maxSupply),
      JSON.stringify(p.orderQuantityLimits),
      p.sanityRate,
      p.sanityMarginPercentage,
      JSON.stringify(p.currentSupply),
      JSON.stringify(p.currentReserve),
      JSON.stringify(p.availableReserve),
      JSON.stringify(p.currentOutcomePaymentReserve),
      p.allowSells,
      p.allowReserveWithdrawals,
      p.alphaBond,
      p.batchBlocks,
      p.outcomePayment,
      p.oracleDid,
      p.bondDid,
    ]);
  } catch (error) {
    throw error;
  }
};

export type BondAlpha = {
  bondDid: string;
  alpha: string;
  oracleDid: string;
  height: number;
  timestamp: Date;
};

const createBondAlphaSql = `
INSERT INTO "public"."BondAlpha" ( "bondDid", "alpha", "oracleDid", "height", "timestamp")
VALUES ( $1, $2, $3, $4, $5 );
`;
export const createBondAlpha = async (p: BondAlpha): Promise<void> => {
  try {
    await pool.query(createBondAlphaSql, [
      p.bondDid,
      p.alpha,
      p.oracleDid,
      p.height,
      p.timestamp,
    ]);
  } catch (error) {
    throw error;
  }
};

export type BondBuy = {
  bondDid: string;
  accountDid: string;
  amount: any; // JSON
  maxPrices: any; // JSON
  height: number;
  timestamp: Date;
};

const createBondBuySql = `
INSERT INTO "public"."BondBuy" ( "bondDid", "accountDid", "amount", "maxPrices", "height", "timestamp")
VALUES ( $1, $2, $3, $4, $5, $6 );
`;
export const createBondBuy = async (p: BondBuy): Promise<void> => {
  try {
    await pool.query(createBondBuySql, [
      p.bondDid,
      p.accountDid,
      JSON.stringify(p.amount),
      JSON.stringify(p.maxPrices),
      p.height,
      p.timestamp,
    ]);
  } catch (error) {
    throw error;
  }
};

export type BondSell = {
  bondDid: string;
  accountDid: string;
  amount: any; // JSON
  height: number;
  timestamp: Date;
};

const createBondSellSql = `
INSERT INTO "public"."BondSell" ( "bondDid", "accountDid", "amount", "height", "timestamp")
VALUES ( $1, $2, $3, $4, $5 );
`;
export const createBondSell = async (p: BondSell): Promise<void> => {
  try {
    await pool.query(createBondSellSql, [
      p.bondDid,
      p.accountDid,
      JSON.stringify(p.amount),
      p.height,
      p.timestamp,
    ]);
  } catch (error) {
    throw error;
  }
};

export type BondSwap = {
  bondDid: string;
  accountDid: string;
  amount: any; // JSON
  toToken: string;
  height: number;
  timestamp: Date;
};

const createBondSwapSql = `
INSERT INTO "public"."BondSwap" ( "bondDid", "accountDid", "amount", "toToken", "height", "timestamp")
VALUES ( $1, $2, $3, $4, $5, $6 );
`;
export const createBondSwap = async (p: BondSwap): Promise<void> => {
  try {
    await pool.query(createBondSwapSql, [
      p.bondDid,
      p.accountDid,
      JSON.stringify(p.amount),
      p.toToken,
      p.height,
      p.timestamp,
    ]);
  } catch (error) {
    throw error;
  }
};

export type ShareWithdrawal = {
  bondDid: string;
  recipientDid: string;
  recipientAddress: string;
  amount: any; // JSON
  height: number;
  timestamp: Date;
};

const createShareWithdrawalSql = `
INSERT INTO "public"."ShareWithdrawal" ( "bondDid", "recipientDid", "recipientAddress", "amount", "height", "timestamp")
VALUES ( $1, $2, $3, $4, $5, $6 );
`;
export const createShareWithdrawal = async (
  p: ShareWithdrawal
): Promise<void> => {
  try {
    await pool.query(createShareWithdrawalSql, [
      p.bondDid,
      p.recipientDid,
      p.recipientAddress,
      JSON.stringify(p.amount),
      p.height,
      p.timestamp,
    ]);
  } catch (error) {
    throw error;
  }
};

export type OutcomePayment = {
  bondDid: string;
  senderDid: string;
  senderAddress: string;
  amount: any; // JSON
  height: number;
  timestamp: Date;
};

const createOutcomePaymentSql = `
INSERT INTO "public"."OutcomePayment" ( "bondDid", "senderDid", "senderAddress", "amount", "height", "timestamp")
VALUES ( $1, $2, $3, $4, $5, $6 );
`;
export const createOutcomePayment = async (
  p: OutcomePayment
): Promise<void> => {
  try {
    await pool.query(createOutcomePaymentSql, [
      p.bondDid,
      p.senderDid,
      p.senderAddress,
      JSON.stringify(p.amount),
      p.height,
      p.timestamp,
    ]);
  } catch (error) {
    throw error;
  }
};

export type ReserveWithdrawal = {
  bondDid: string;
  withdrawerDid: string;
  withdrawerAddress: string;
  amount: any; // JSON
  reserveWithdrawalAddress: string;
  height: number;
  timestamp: Date;
};

const createReserveWithdrawalSql = `
INSERT INTO "public"."ReserveWithdrawal" ( "bondDid", "withdrawerDid", "withdrawerAddress", "amount", "reserveWithdrawalAddress", "height", "timestamp")
VALUES ( $1, $2, $3, $4, $5, $6, $7 );
`;
export const createReserveWithdrawal = async (
  p: ReserveWithdrawal
): Promise<void> => {
  try {
    await pool.query(createReserveWithdrawalSql, [
      p.bondDid,
      p.withdrawerDid,
      p.withdrawerAddress,
      JSON.stringify(p.amount),
      p.reserveWithdrawalAddress,
      p.height,
      p.timestamp,
    ]);
  } catch (error) {
    throw error;
  }
};
