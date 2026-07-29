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
  // ==========================================================================
  // DAO DAO v2.7.1 uploads (deterministic upload order on devnet → 30-51).
  // Names reuse the existing v2.0.3 name strings so the event-handler switch
  // in event_data_sync_wasm_dao.ts dispatches unchanged; the three names that
  // did not exist in v2.0.3 are marked NEW.
  // TODO: testnet/mainnet IDs filled at real upload; 0 = not uploaded
  // ==========================================================================
  {
    name: "dao_core",
    path: ["contracts", "daodao_v271", "dao_dao_core.wasm"],
    category: "daodao",
    code: { devnet: 88, testnet: 52, mainnet: 51 },
  },
  {
    name: "dao_proposal_single",
    path: ["contracts", "daodao_v271", "dao_proposal_single.wasm"],
    category: "daodao",
    code: { devnet: 89, testnet: 53, mainnet: 52 },
  },
  {
    name: "dao_pre_propose_single",
    path: ["contracts", "daodao_v271", "dao_pre_propose_single.wasm"],
    category: "daodao",
    code: { devnet: 90, testnet: 54, mainnet: 53 },
  },
  {
    name: "dao_voting_cw4",
    path: ["contracts", "daodao_v271", "dao_voting_cw4.wasm"],
    category: "daodao",
    code: { devnet: 91, testnet: 55, mainnet: 54 },
  },
  {
    name: "cw4_group",
    path: ["contracts", "cosmwasm_v271", "cw4_group.wasm"],
    category: "daodao",
    code: { devnet: 92, testnet: 56, mainnet: 55 },
  },
  {
    name: "dao_proposal_multiple",
    path: ["contracts", "daodao_v271", "dao_proposal_multiple.wasm"],
    category: "daodao",
    code: { devnet: 93, testnet: 57, mainnet: 56 },
  },
  {
    name: "dao_pre_propose_multiple",
    path: ["contracts", "daodao_v271", "dao_pre_propose_multiple.wasm"],
    category: "daodao",
    code: { devnet: 94, testnet: 58, mainnet: 57 },
  },
  {
    name: "dao_pre_propose_approval_single",
    path: ["contracts", "daodao_v271", "dao_pre_propose_approval_single.wasm"],
    category: "daodao",
    code: { devnet: 95, testnet: 59, mainnet: 58 },
  },
  {
    name: "dao_pre_propose_approver",
    path: ["contracts", "daodao_v271", "dao_pre_propose_approver.wasm"],
    category: "daodao",
    code: { devnet: 96, testnet: 60, mainnet: 59 },
  },
  {
    // NEW name in v2.7.1 — no v2.0.3 twin.
    name: "dao_pre_propose_approval_multiple",
    path: ["contracts", "daodao_v271", "dao_pre_propose_approval_multiple.wasm"],
    category: "daodao",
    code: { devnet: 97, testnet: 61, mainnet: 60 },
  },
  {
    name: "dao_voting_cw20_staked",
    path: ["contracts", "daodao_v271", "dao_voting_cw20_staked.wasm"],
    category: "daodao",
    code: { devnet: 98, testnet: 62, mainnet: 61 },
  },
  {
    name: "cw20_stake",
    path: ["contracts", "daodao_v271", "cw20_stake.wasm"],
    category: "daodao",
    code: { devnet: 99, testnet: 63, mainnet: 62 },
  },
  {
    name: "cw20_base",
    path: ["contracts", "cosmwasm_v271", "cw20_base.wasm"],
    category: "daodao",
    code: { devnet: 100, testnet: 64, mainnet: 63 },
  },
  {
    name: "dao_voting_cw721_staked",
    path: ["contracts", "daodao_v271", "dao_voting_cw721_staked.wasm"],
    category: "daodao",
    code: { devnet: 101, testnet: 65, mainnet: 64 },
  },
  {
    name: "cw721_base",
    path: ["contracts", "cosmwasm_v271", "cw721_base.wasm"],
    category: "daodao",
    code: { devnet: 102, testnet: 66, mainnet: 65 },
  },
  {
    name: "cw_admin_factory",
    path: ["contracts", "daodao_v271", "cw_admin_factory.wasm"],
    category: "daodao",
    code: { devnet: 103, testnet: 67, mainnet: 66 },
  },
  {
    name: "cw_vesting",
    path: ["contracts", "daodao_v271", "cw_vesting.wasm"],
    category: "daodao",
    code: { devnet: 104, testnet: 68, mainnet: 67 },
  },
  {
    name: "cw_payroll_factory",
    path: ["contracts", "daodao_v271", "cw_payroll_factory.wasm"],
    category: "daodao",
    code: { devnet: 105, testnet: 69, mainnet: 68 },
  },
  {
    // NEW name in v2.7.1 — no v2.0.3 twin.
    name: "dao_rewards_distributor",
    path: ["contracts", "daodao_v271", "dao_rewards_distributor.wasm"],
    category: "daodao",
    code: { devnet: 106, testnet: 70, mainnet: 69 },
  },
  {
    // NEW name in v2.7.1 — no v2.0.3 twin. Classification only for now —
    // delegation contract events fall through processDaoEvent's silent
    // default; no delegation tables are built.
    name: "dao_vote_delegation",
    path: ["contracts", "daodao_v271", "dao_vote_delegation.wasm"],
    category: "daodao",
    code: { devnet: 107, testnet: 71, mainnet: 70 },
  },
  {
    name: "cw20_stake_external_rewards",
    path: ["contracts", "daodao_v271", "cw20_stake_external_rewards.wasm"],
    category: "daodao",
    code: { devnet: 108, testnet: 72, mainnet: 71 },
  },
  {
    name: "cw20_stake_reward_distributor",
    path: ["contracts", "daodao_v271", "cw20_stake_reward_distributor.wasm"],
    category: "daodao",
    code: { devnet: 109, testnet: 73, mainnet: 72 },
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
 *
 * Entries with code id 0 mean "not uploaded on this network yet" and are
 * excluded — on-chain code ids start at 1, and the instantiate handler
 * defaults a missing code_id attribute to 0, so a 0 key here would
 * misclassify unknown contracts (and multiple placeholder-0 entries would
 * silently collide on the same map key anyway).
 */
export const CODE_ID_CONTRACT_MAP = new Map<number, string>(
  WASM_CODE_IDS.filter((item) => item.code[NETWORK] > 0).map((item) => [
    item.code[NETWORK],
    item.name,
  ])
);

/**
 * Map of DAO DAO contract code ids to their names
 * This is used to check if a contract is a DAO DAO contract by querying the code id
 *
 * Placeholder code id 0 ("not uploaded on this network") is excluded — see
 * CODE_ID_CONTRACT_MAP. This also keeps listDaodaoContractsByType's
 * `code_id = ANY(...)` filter from matching wasm_instantiate rows that were
 * stored with a defaulted code_id of 0.
 */
export const DAODAO_CONTRACT_CODE_IDS = new Map<number, string>(
  WASM_CODE_IDS.filter(
    (item) => item.category === "daodao" && item.code[NETWORK] > 0
  ).map((item) => [item.code[NETWORK], item.name])
);
