import { DAODAO_CONTRACT_CODE_IDS } from "../constants/wasm_code_ids";
import { dbQuery } from "./client";

// =============================================
// DAO Core Operations
// =============================================

export type DaoCore = {
  address: string;
  name?: string;
  description?: string;
  image_url?: string;
  automatically_add_cw20s?: boolean;
  automatically_add_cw721s?: boolean;
  dao_uri?: string;
  admin_address?: string;
  created_at: Date;
  block_height: number;
};

const createDaoCoreSql = `
INSERT INTO dao_core (
  address, name, description, image_url, automatically_add_cw20s,
  automatically_add_cw721s, dao_uri, admin_address, created_at, block_height
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (address) DO NOTHING;
`;

export const createDaoCore = async (data: DaoCore): Promise<void> => {
  await dbQuery(createDaoCoreSql, [
    data.address,
    data.name,
    data.description,
    data.image_url,
    data.automatically_add_cw20s,
    data.automatically_add_cw721s,
    data.dao_uri,
    data.admin_address,
    data.created_at,
    data.block_height,
  ]);
};

const updateDaoCoreSql = `
UPDATE dao_core SET
  name = $2,
  description = $3,
  image_url = $4,
  automatically_add_cw20s = $5,
  automatically_add_cw721s = $6,
  dao_uri = $7
WHERE address = $1;
`;

export const updateDaoCore = async (data: {
  address: string;
  name?: string;
  description?: string;
  image_url?: string;
  automatically_add_cw20s?: boolean;
  automatically_add_cw721s?: boolean;
  dao_uri?: string;
}): Promise<void> => {
  await dbQuery(updateDaoCoreSql, [
    data.address,
    data.name,
    data.description,
    data.image_url,
    data.automatically_add_cw20s,
    data.automatically_add_cw721s,
    data.dao_uri,
  ]);
};

const updateDaoCoreAdminAddressSql = `
UPDATE dao_core SET admin_address = $2 WHERE address = $1;
`;

export const updateDaoCoreAdminAddress = async (data: {
  address: string;
  admin_address: string;
}): Promise<void> => {
  await dbQuery(updateDaoCoreAdminAddressSql, [
    data.address,
    data.admin_address,
  ]);
};

const updateDaoCoreVotingModuleSql = `
UPDATE dao_core SET voting_module = $2 WHERE address = $1;
`;

export const updateDaoCoreVotingModule = async (data: {
  address: string;
  voting_module: string;
}): Promise<void> => {
  await dbQuery(updateDaoCoreVotingModuleSql, [
    data.address,
    data.voting_module,
  ]);
};

// =============================================
// DAO Proposal Operations
// =============================================

export type DaoProposal = {
  id: string;
  proposal_module: string;
  title?: string;
  description?: string;
  proposer?: string;
  start_height?: number;
  min_voting_period?: any;
  expiration?: any;
  threshold?: any;
  total_power?: string;
  allow_revoting?: boolean;
  msgs?: any;
  status?: string;
  votes?: any;
  created_at: Date;
  block_height: number;
};

const createDaoProposalSql = `
INSERT INTO dao_proposal (
  id, proposal_module, title, description, proposer,
  status, msgs, start_height, min_voting_period, expiration, threshold,
  total_power, allow_revoting, votes, created_at, block_height
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
ON CONFLICT (proposal_module, id) DO NOTHING;
`;

export const createDaoProposal = async (data: DaoProposal): Promise<void> => {
  await dbQuery(createDaoProposalSql, [
    data.id,
    data.proposal_module,
    data.title,
    data.description,
    data.proposer,
    data.status,
    data.msgs ? JSON.stringify(data.msgs) : null,
    data.start_height,
    data.min_voting_period ? JSON.stringify(data.min_voting_period) : null,
    data.expiration ? JSON.stringify(data.expiration) : null,
    data.threshold ? JSON.stringify(data.threshold) : null,
    data.total_power,
    data.allow_revoting,
    data.votes ? JSON.stringify(data.votes) : null,
    data.created_at,
    data.block_height,
  ]);
};

const updateDaoProposalStatusSql = `
UPDATE dao_proposal SET status = $3 WHERE proposal_module = $1 AND id = $2;
`;

export const updateDaoProposalStatus = async (data: {
  proposal_module: string;
  id: string;
  status: string;
}): Promise<void> => {
  await dbQuery(updateDaoProposalStatusSql, [
    data.proposal_module,
    data.id,
    data.status,
  ]);
};

const updateDaoProposalStatusAndVotesSql = `
UPDATE dao_proposal SET status = $3, votes = $4 WHERE proposal_module = $1 AND id = $2;
`;

export const updateDaoProposalStatusAndVotes = async (data: {
  proposal_module: string;
  id: string;
  status: string;
  votes: any;
}): Promise<void> => {
  await dbQuery(updateDaoProposalStatusAndVotesSql, [
    data.proposal_module,
    data.id,
    data.status,
    data.votes ? JSON.stringify(data.votes) : null,
  ]);
};

// =============================================
// DAO Vote Operations
// =============================================

export type DaoVote = {
  proposal_module: string;
  proposal_id: string;
  voter: string;
  vote: string;
  power?: string;
  rationale?: string;
  voted_at: Date;
  block_height: number;
};

const createDaoVoteSql = `
INSERT INTO dao_vote (
  proposal_module, proposal_id, voter, vote, power, rationale, voted_at, block_height
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (proposal_module, proposal_id, voter) DO UPDATE SET
  vote = EXCLUDED.vote,
  power = EXCLUDED.power,
  rationale = EXCLUDED.rationale,
  voted_at = EXCLUDED.voted_at,
  block_height = EXCLUDED.block_height;
`;

export const createDaoVote = async (data: DaoVote): Promise<void> => {
  await dbQuery(createDaoVoteSql, [
    data.proposal_module,
    data.proposal_id,
    data.voter,
    data.vote,
    data.power,
    data.rationale,
    data.voted_at,
    data.block_height,
  ]);
};

// =============================================
// DAO Proposal Module Operations
// =============================================

export type DaoProposalModule = {
  address: string;
  module_type: string;
  dao_address: string;
  prefix?: string;
  status?: string;
  created_at: Date;
  block_height: number;
  proposal_creation_policy?: any;
  config?: any;
};

const createDaoProposalModuleSql = `
INSERT INTO dao_proposal_module (
  address, dao_address, module_type, created_at, block_height,
  proposal_creation_policy, config
) VALUES ($1, $2, $3, $4, $5, $6, $7);
`;

export const createDaoProposalModule = async (
  data: DaoProposalModule
): Promise<void> => {
  await dbQuery(createDaoProposalModuleSql, [
    data.address,
    data.dao_address,
    data.module_type,
    data.created_at,
    data.block_height,
    data.proposal_creation_policy
      ? JSON.stringify(data.proposal_creation_policy)
      : null,
    data.config ? JSON.stringify(data.config) : null,
  ]);
};

const updateDaoProposalModulePreProposeModuleSql = `
UPDATE dao_proposal_module SET pre_propose_module = $2 WHERE address = $1;
`;

export const updateDaoProposalModulePreProposeModule = async (data: {
  address: string;
  pre_propose_module: string;
}): Promise<void> => {
  await dbQuery(updateDaoProposalModulePreProposeModuleSql, [
    data.address,
    data.pre_propose_module,
  ]);
};

const updateDaoProposalModuleProposalCreationPolicySql = `
UPDATE dao_proposal_module SET proposal_creation_policy = $2 WHERE address = $1;
`;

export const updateDaoProposalModuleProposalCreationPolicy = async (data: {
  address: string;
  proposal_creation_policy: any;
}): Promise<void> => {
  await dbQuery(updateDaoProposalModuleProposalCreationPolicySql, [
    data.address,
    data.proposal_creation_policy
      ? JSON.stringify(data.proposal_creation_policy)
      : null,
  ]);
};

const updateDaoProposalModuleConfigSql = `
UPDATE dao_proposal_module SET config = $2 WHERE address = $1;
`;

export const updateDaoProposalModuleConfig = async (data: {
  address: string;
  config: any;
}): Promise<void> => {
  await dbQuery(updateDaoProposalModuleConfigSql, [
    data.address,
    data.config ? JSON.stringify(data.config) : null,
  ]);
};

// =============================================
// DAO Voting Module Operations
// =============================================

export type DaoVotingModule = {
  address: string;
  module_type: string;
  token_address?: string;
  staking_contract?: string;
  group_contract_address?: string;
  nft_contract?: string;
  native_denom?: string;
  total_weight?: string;
  active_threshold?: any;
  unstaking_duration?: any;
  created_at: Date;
  block_height: number;
};

const createDaoVotingModuleSql = `
INSERT INTO dao_voting_module (
  address, module_type, token_address,
  staking_contract, group_contract_address, total_weight, nft_contract, native_denom, active_threshold, unstaking_duration, created_at, block_height
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT (address) DO NOTHING;
`;

export const createDaoVotingModule = async (
  data: DaoVotingModule
): Promise<void> => {
  await dbQuery(createDaoVotingModuleSql, [
    data.address,
    data.module_type,
    data.token_address,
    data.staking_contract,
    data.group_contract_address,
    data.total_weight,
    data.nft_contract,
    data.native_denom,
    data.active_threshold ? JSON.stringify(data.active_threshold) : null,
    data.unstaking_duration ? JSON.stringify(data.unstaking_duration) : null,
    data.created_at,
    data.block_height,
  ]);
};

export const updateDaoVotingModuleGroupContractAddress = async (data: {
  address: string;
  group_contract_address: string;
}): Promise<void> => {
  await dbQuery(
    "UPDATE dao_voting_module SET group_contract_address = $2 WHERE address = $1;",
    [data.address, data.group_contract_address]
  );
};

export const updateDaoVotingModuleTokenContractAddress = async (data: {
  address: string;
  token_address: string;
}): Promise<void> => {
  await dbQuery(
    "UPDATE dao_voting_module SET token_address = $2 WHERE address = $1;",
    [data.address, data.token_address]
  );
};

export const updateDaoVotingModuleTokenStakingContractAddress = async (data: {
  address: string;
  staking_contract: string;
}): Promise<void> => {
  await dbQuery(
    "UPDATE dao_voting_module SET staking_contract = $2 WHERE address = $1;",
    [data.address, data.staking_contract]
  );
};

export const updateDaoVotingModuleTotalWeight = async (data: {
  address: string;
  total_weight: string;
}): Promise<void> => {
  await dbQuery(
    "UPDATE dao_voting_module SET total_weight = $2 WHERE address = $1;",
    [data.address, data.total_weight]
  );
};

export const getDaoVotingModuleTotalWeight = async (
  address: string
): Promise<number> => {
  const result = await dbQuery(
    "SELECT total_weight FROM dao_voting_module WHERE address = $1;",
    [address]
  );
  return parseInt(result.rows[0]?.total_weight || "0");
};

export const updateDaoAllVotingModulesTotalWeightForCw20Contract = async (
  cw20_staking_contract: string,
  total_weight: string
): Promise<void> => {
  await dbQuery(
    "UPDATE dao_voting_module SET total_weight = $2 WHERE staking_contract = $1;",
    [cw20_staking_contract, total_weight]
  );
};

export const updateDaoAllVotingModulesTotalWeightForGroupContract = async (
  group_contract_address: string,
  total_weight: string
): Promise<void> => {
  await dbQuery(
    "UPDATE dao_voting_module SET total_weight = $2 WHERE group_contract_address = $1;",
    [group_contract_address, total_weight]
  );
};

export const updateDaoVotingModuleUnstakingDuration = async (data: {
  address: string;
  unstaking_duration: any;
}): Promise<void> => {
  await dbQuery(
    "UPDATE dao_voting_module SET unstaking_duration = $2 WHERE address = $1;",
    [
      data.address,
      data.unstaking_duration ? JSON.stringify(data.unstaking_duration) : null,
    ]
  );
};

export const updateDaoVotingModuleThreshold = async (data: {
  address: string;
  active_threshold?: any;
}): Promise<void> => {
  await dbQuery(
    "UPDATE dao_voting_module SET active_threshold = $2 WHERE address = $1;",
    [
      data.address,
      data.active_threshold ? JSON.stringify(data.active_threshold) : null,
    ]
  );
};

export const updateDaoAllVotingModulesUnstakingDurationForCw20Contract = async (
  cw20_staking_contract: string,
  unstaking_duration: any
): Promise<void> => {
  await dbQuery(
    "UPDATE dao_voting_module SET unstaking_duration = $2 WHERE staking_contract = $1;",
    [
      cw20_staking_contract,
      unstaking_duration ? JSON.stringify(unstaking_duration) : null,
    ]
  );
};

// =============================================
// DAO Pre-Propose Module Operations
// =============================================

export type DaoPreProposeModule = {
  address: string;
  proposal_module: string;
  deposit_info?: any;
  open_proposal_submission: boolean;
  created_at: Date;
  block_height: number;
};

const createDaoPreProposeModuleSql = `
INSERT INTO dao_pre_propose_module (
  address, proposal_module, deposit_info,
  open_proposal_submission, created_at, block_height
) VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (address) DO NOTHING;
`;

export const createDaoPreProposeModule = async (
  data: DaoPreProposeModule
): Promise<void> => {
  await dbQuery(createDaoPreProposeModuleSql, [
    data.address,
    data.proposal_module,
    data.deposit_info ? JSON.stringify(data.deposit_info) : null,
    data.open_proposal_submission,
    data.created_at,
    data.block_height,
  ]);
};

const updateDaoPreProposeModuleSql = `
UPDATE dao_pre_propose_module SET
  deposit_info = $2,
  open_proposal_submission = $3
WHERE address = $1;
`;

export const updateDaoPreProposeModule = async (data: {
  address: string;
  deposit_info?: any;
  open_proposal_submission: boolean;
}): Promise<void> => {
  await dbQuery(updateDaoPreProposeModuleSql, [
    data.address,
    data.deposit_info ? JSON.stringify(data.deposit_info) : null,
    data.open_proposal_submission,
  ]);
};

// =============================================
// Contract Detection Helper
// =============================================

export const getDaoContractInfo = async (
  contractAddress: string
): Promise<{
  contractType: string;
} | null> => {
  const wasmResult = await dbQuery(
    "SELECT code_id FROM wasm_instantiate WHERE address = $1;",
    [contractAddress]
  );
  if (wasmResult.rows.length === 0) return null;

  const codeId = wasmResult.rows[0].code_id;
  const contractType = DAODAO_CONTRACT_CODE_IDS.get(codeId);
  if (!contractType) return null;

  return {
    contractType,
  };
};

// =============================================
// Contract Registry Operations
// =============================================

export const ensureDaoCw4GroupContract = async (
  address: string
): Promise<void> => {
  await dbQuery(
    "INSERT INTO dao_cw4_group_contract (address) VALUES ($1) ON CONFLICT (address) DO NOTHING",
    [address]
  );
};

export const ensureDaoCw20StakingContract = async (
  address: string
): Promise<void> => {
  await dbQuery(
    "INSERT INTO dao_cw20_staking_contract (address) VALUES ($1) ON CONFLICT (address) DO NOTHING",
    [address]
  );
};

// =============================================
// DAO Member Operations
// =============================================

// CW4 Member Operations
// =============================================

const batchInsertDaoCw4MembersSql = `
INSERT INTO dao_cw4_member (group_contract_address, member_address, weight)
SELECT $1, m.member_address, m.weight
FROM jsonb_to_recordset($2) AS m(member_address text, weight int)
ON CONFLICT (group_contract_address, member_address) DO UPDATE SET
  weight = EXCLUDED.weight;
`;

export const batchUpdateDaoCw4Members = async (
  group_contract_address: string,
  members: Array<{ addr: string; weight: number }>
): Promise<void> => {
  // Remove all existing members first
  await dbQuery(
    "DELETE FROM dao_cw4_member WHERE group_contract_address = $1",
    [group_contract_address]
  );

  // Bulk insert new members using PostgreSQL jsonb_to_recordset
  if (members.length > 0) {
    const membersJson = members.map((member) => ({
      member_address: member.addr,
      weight: member.weight,
    }));

    await dbQuery(batchInsertDaoCw4MembersSql, [
      group_contract_address,
      JSON.stringify(membersJson),
    ]);
  }
};

export const getDaoCw4SumWeightForGroupContract = async (
  group_contract_address: string
): Promise<number> => {
  const result = await dbQuery(
    "SELECT SUM(weight) AS sum FROM dao_cw4_member WHERE group_contract_address = $1;",
    [group_contract_address]
  );
  return parseInt(result.rows[0]?.sum || "0");
};

// CW20 Staker Operations
// =============================================

export type DaoCw20Staker = {
  staking_contract: string;
  staker_address: string;
  staked_amount: string;
};

const upsertDaoCw20StakerSql = `
INSERT INTO dao_cw20_staker (
  staking_contract, staker_address, staked_amount
) VALUES ($1, $2, $3)
ON CONFLICT (staking_contract, staker_address) DO UPDATE SET
  staked_amount = EXCLUDED.staked_amount;
`;

export const upsertDaoCw20Staker = async (
  data: DaoCw20Staker
): Promise<void> => {
  await dbQuery(upsertDaoCw20StakerSql, [
    data.staking_contract,
    data.staker_address,
    data.staked_amount,
  ]);
};

export const deleteDaoCw20Staker = async (
  staking_contract: string,
  staker_address: string
): Promise<void> => {
  await dbQuery(
    "DELETE FROM dao_cw20_staker WHERE staking_contract = $1 AND staker_address = $2;",
    [staking_contract, staker_address]
  );
};

export const getDaoCw20StakerStakedAmount = async (
  staking_contract: string,
  staker_address: string
): Promise<string> => {
  const result = await dbQuery(
    "SELECT staked_amount FROM dao_cw20_staker WHERE staking_contract = $1 AND staker_address = $2;",
    [staking_contract, staker_address]
  );
  return result.rows[0]?.staked_amount || "0";
};

export const getDaoCw20StakersSumStakedForContract = async (
  staking_contract: string
): Promise<number> => {
  const result = await dbQuery(
    "SELECT SUM(staked_amount) AS sum FROM dao_cw20_staker WHERE staking_contract = $1;",
    [staking_contract]
  );
  return parseInt(result.rows[0]?.sum || "0");
};

// CW721 Staker Operations
// =============================================

const batchInsertDaoCw721StakersSql = `
INSERT INTO dao_cw721_staker (voting_module_address, staker_address, token_id)
SELECT $1, $2, s.token_id
FROM jsonb_to_recordset($3) AS s(token_id text)
ON CONFLICT (voting_module_address, staker_address, token_id) DO NOTHING;
`;

export const batchInsertDaoCw721Stakers = async ({
  voting_module_address,
  address,
  ids,
  delete_first,
}: {
  voting_module_address: string;
  address: string;
  ids: { token_id: string }[];
  delete_first: boolean;
}): Promise<void> => {
  if (delete_first) {
    await dbQuery(
      "DELETE FROM dao_cw721_staker WHERE voting_module_address = $1 AND staker_address = $2;",
      [voting_module_address, address]
    );
  }
  if (ids.length > 0) {
    await dbQuery(batchInsertDaoCw721StakersSql, [
      voting_module_address,
      address,
      JSON.stringify(ids),
    ]);
  }
};

export const getDaoCw721StakeCount = async (
  voting_module_address: string
): Promise<number> => {
  const result = await dbQuery(
    "SELECT COUNT(*) FROM dao_cw721_staker WHERE voting_module_address = $1;",
    [voting_module_address]
  );
  return result.rows[0]?.count || 0;
};

// Native Staker Operations
// =============================================

export type DaoNativeStaker = {
  voting_module_address: string;
  staker_address: string;
  staked_amount: string;
};

const upsertDaoNativeStakerSql = `
INSERT INTO dao_native_staker (
  voting_module_address, staker_address, staked_amount
) VALUES ($1, $2, $3)
ON CONFLICT (voting_module_address, staker_address) DO UPDATE SET
  staked_amount = EXCLUDED.staked_amount
`;

export const upsertDaoNativeStaker = async (
  data: DaoNativeStaker
): Promise<void> => {
  await dbQuery(upsertDaoNativeStakerSql, [
    data.voting_module_address,
    data.staker_address,
    data.staked_amount,
  ]);
};

export const getDaoNativeStakerStakedAmount = async (
  voting_module_address: string,
  staker_address: string
): Promise<string> => {
  const result = await dbQuery(
    "SELECT staked_amount FROM dao_native_staker WHERE voting_module_address = $1 AND staker_address = $2;",
    [voting_module_address, staker_address]
  );
  return result.rows[0]?.staked_amount || "0";
};

export const deleteDaoNativeStaker = async (
  voting_module_address: string,
  staker_address: string
): Promise<void> => {
  await dbQuery(
    "DELETE FROM dao_native_staker WHERE voting_module_address = $1 AND staker_address = $2;",
    [voting_module_address, staker_address]
  );
};
