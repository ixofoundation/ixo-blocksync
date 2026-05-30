import { NETWORK } from "../util/secrets";

const WASM_CODE_IDS = [
  {
    name: "dao_core",
    path: ["contracts", "daodao", "dao_core.wasm"],
    category: "daodao",
    code: { devnet: 3, testnet: 3, mainnet: 3 },
  },
  {
    name: "cw_admin_factory",
    path: ["contracts", "daodao", "cw_admin_factory.wasm"],
    category: "daodao",
    code: { devnet: 4, testnet: 4, mainnet: 4 },
  },
  {
    name: "cw_fund_distributor",
    path: ["contracts", "daodao", "cw_fund_distributor.wasm"],
    category: "daodao",
    code: { devnet: 5, testnet: 5, mainnet: 5 },
  },
  {
    name: "cw_payroll_factory",
    path: ["contracts", "daodao", "cw_payroll_factory.wasm"],
    category: "daodao",
    code: { devnet: 6, testnet: 6, mainnet: 6 },
  },
  {
    name: "cw_token_swap",
    path: ["contracts", "daodao", "cw_token_swap.wasm"],
    category: "daodao",
    code: { devnet: 7, testnet: 7, mainnet: 7 },
  },
  {
    name: "cw_vesting",
    path: ["contracts", "daodao", "cw_vesting.wasm"],
    category: "daodao",
    code: { devnet: 8, testnet: 8, mainnet: 8 },
  },
  {
    name: "dao_migrator",
    path: ["contracts", "daodao", "dao_migrator.wasm"],
    category: "daodao",
    code: { devnet: 9, testnet: 9, mainnet: 9 },
  },
  {
    name: "dao_pre_propose_approval_single",
    path: ["contracts", "daodao", "dao_pre_propose_approval_single.wasm"],
    category: "daodao",
    code: { devnet: 10, testnet: 10, mainnet: 10 },
  },
  {
    name: "dao_pre_propose_approver",
    path: ["contracts", "daodao", "dao_pre_propose_approver.wasm"],
    category: "daodao",
    code: { devnet: 11, testnet: 11, mainnet: 11 },
  },
  {
    name: "dao_pre_propose_multiple",
    path: ["contracts", "daodao", "dao_pre_propose_multiple.wasm"],
    category: "daodao",
    code: { devnet: 12, testnet: 12, mainnet: 12 },
  },
  {
    name: "dao_pre_propose_single",
    path: ["contracts", "daodao", "dao_pre_propose_single.wasm"],
    category: "daodao",
    code: { devnet: 13, testnet: 13, mainnet: 13 },
  },
  {
    name: "dao_proposal_condorcet",
    path: ["contracts", "daodao", "dao_proposal_condorcet.wasm"],
    category: "daodao",
    code: { devnet: 14, testnet: 14, mainnet: 14 },
  },
  {
    name: "dao_proposal_multiple",
    path: ["contracts", "daodao", "dao_proposal_multiple.wasm"],
    category: "daodao",
    code: { devnet: 15, testnet: 15, mainnet: 15 },
  },
  {
    name: "dao_proposal_single",
    path: ["contracts", "daodao", "dao_proposal_single.wasm"],
    category: "daodao",
    code: { devnet: 16, testnet: 16, mainnet: 16 },
  },
  {
    name: "cw20_stake",
    path: ["contracts", "daodao", "cw20_stake.wasm"],
    category: "daodao",
    code: { devnet: 17, testnet: 17, mainnet: 17 },
  },
  {
    name: "cw20_stake_external_rewards",
    path: ["contracts", "daodao", "cw20_stake_external_rewards.wasm"],
    category: "daodao",
    code: { devnet: 18, testnet: 18, mainnet: 18 },
  },
  {
    name: "cw20_stake_reward_distributor",
    path: ["contracts", "daodao", "cw20_stake_reward_distributor.wasm"],
    category: "daodao",
    code: { devnet: 19, testnet: 19, mainnet: 19 },
  },
  {
    name: "dao_voting_cw4",
    path: ["contracts", "daodao", "dao_voting_cw4.wasm"],
    category: "daodao",
    code: { devnet: 20, testnet: 20, mainnet: 20 },
  },
  {
    name: "dao_voting_cw20_staked",
    path: ["contracts", "daodao", "dao_voting_cw20_staked.wasm"],
    category: "daodao",
    code: { devnet: 21, testnet: 21, mainnet: 21 },
  },
  {
    name: "dao_voting_cw721_staked",
    path: ["contracts", "daodao", "dao_voting_cw721_staked.wasm"],
    category: "daodao",
    code: { devnet: 22, testnet: 22, mainnet: 22 },
  },
  {
    name: "dao_voting_native_staked",
    path: ["contracts", "daodao", "dao_voting_native_staked.wasm"],
    category: "daodao",
    code: { devnet: 23, testnet: 23, mainnet: 23 },
  },
  {
    name: "cw4_group",
    path: ["contracts", "cosmwasm", "cw4_group.wasm"],
    category: "daodao",
    code: { devnet: 24, testnet: 24, mainnet: 24 },
  },
  {
    name: "cw20_base",
    path: ["contracts", "cosmwasm", "cw20_base.wasm"],
    category: "daodao",
    code: { devnet: 25, testnet: 25, mainnet: 25 },
  },
  {
    name: "cw721_base",
    path: ["contracts", "cosmwasm", "cw721_base.wasm"],
    category: "daodao",
    code: { devnet: 26, testnet: 26, mainnet: 26 },
  },
  {
    name: "wasmswap",
    path: ["contracts", "wasmswap", "wasmswap.wasm"],
    category: "daodao",
    code: { devnet: 27, testnet: 27, mainnet: 27 },
  },
];

// Global checker that NETWORK is valid
if (!["devnet", "testnet", "mainnet"].includes(NETWORK)) {
  throw new Error(
    `Invalid NETWORK: ${NETWORK}, must be one of: devnet, testnet, mainnet`
  );
}

/**
 * Map of all contract code ids to their names
 */
export const CODE_ID_CONTRACT_MAP = new Map<number, string>(
  WASM_CODE_IDS.map((item) => [item.code[NETWORK], item.name])
);

/**
 * Map of DAO DAO contract code ids to their names
 * This is used to check if a contract is a DAO DAO contract by querying the code id
 */
export const DAODAO_CONTRACT_CODE_IDS = new Map<number, string>(
  WASM_CODE_IDS.filter((item) => item.category === "daodao").map((item) => [
    item.code[NETWORK],
    item.name,
  ])
);
