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
// DAO Core Items (key/value metadata set by DAO governance via
// execute_set_item / execute_remove_item)
// =============================================

const upsertDaoCoreItemSql = `
INSERT INTO dao_core_item (dao_address, key, value, updated_at, block_height)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (dao_address, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = EXCLUDED.updated_at,
  block_height = EXCLUDED.block_height;
`;
export const upsertDaoCoreItem = async (data: {
  dao_address: string;
  key: string;
  value: string;
  updated_at: Date;
  block_height: number;
}): Promise<void> => {
  await dbQuery(upsertDaoCoreItemSql, [
    data.dao_address,
    data.key,
    data.value,
    data.updated_at,
    data.block_height,
  ]);
};

const deleteDaoCoreItemSql = `
DELETE FROM dao_core_item WHERE dao_address = $1 AND key = $2;
`;
export const deleteDaoCoreItem = async (
  dao_address: string,
  key: string
): Promise<void> => {
  await dbQuery(deleteDaoCoreItemSql, [dao_address, key]);
};

// =============================================
// Bulk-refresh proposal-modules statuses from dao_core dump_state. Called
// after execute_update_proposal_modules — a passed proposal can add new
// proposal modules to a DAO and/or mark existing ones as 'disabled'.
//
// UPSERT, not UPDATE: dump_state at the event's height already lists a
// brand-NEW module even though its own instantiate event only arrives
// later in the same tx — so we stub a row (address, dao_address, prefix,
// status; other columns NULL) that the subsequent instantiate handling
// fills in via createDaoProposalModule's ON CONFLICT DO UPDATE.
// =============================================
export const refreshDaoProposalModulesFromDumpState = async (
  proposal_modules: Array<{
    address: string;
    prefix?: string;
    status?: string;
  }>,
  dao_address: string,
  created_at: Date,
  block_height: number
): Promise<void> => {
  for (const m of proposal_modules) {
    await dbQuery(
      `INSERT INTO dao_proposal_module (
         address, dao_address, prefix, status, created_at, block_height
       ) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (address) DO UPDATE SET
         prefix = EXCLUDED.prefix,
         status = EXCLUDED.status,
         dao_address = EXCLUDED.dao_address;`,
      [
        m.address,
        dao_address,
        m.prefix ?? null,
        m.status ?? null,
        created_at,
        block_height,
      ]
    );
  }
};

// =============================================
// DAO Proposal Operations
// =============================================

// Normalize a proposal status coming off the chain into a plain string for
// the TEXT column. dao-proposal contracts serialize `Status` as a string
// for unit variants ("open", "passed", "executed", "vetoed", ...) but
// v2.7.1's veto timelock variant carries data, so serde emits an OBJECT:
//   { "veto_timelock": { "expiration": ... } }  →  "veto_timelock"
// Generic single-key extraction keeps any future data-carrying variant from
// ever writing "[object Object]" or a JSON blob into the column.
export const normalizeProposalStatus = (
  status: string | Record<string, unknown> | null | undefined
): string | null => {
  if (status === null || status === undefined) return null;
  if (typeof status === "string") return status;
  if (typeof status === "object") {
    const keys = Object.keys(status);
    if (keys.length > 0) return keys[0];
  }
  return null;
};

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
  // May arrive as the raw chain value (string or data-carrying object) —
  // normalizeProposalStatus is applied on every write.
  status?: string | Record<string, unknown>;
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
    normalizeProposalStatus(data.status),
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
  status: string | Record<string, unknown>;
}): Promise<void> => {
  await dbQuery(updateDaoProposalStatusSql, [
    data.proposal_module,
    data.id,
    normalizeProposalStatus(data.status),
  ]);
};

const updateDaoProposalStatusAndVotesSql = `
UPDATE dao_proposal SET status = $3, votes = $4 WHERE proposal_module = $1 AND id = $2;
`;

export const updateDaoProposalStatusAndVotes = async (data: {
  proposal_module: string;
  id: string;
  status: string | Record<string, unknown>;
  votes: any;
}): Promise<void> => {
  await dbQuery(updateDaoProposalStatusAndVotesSql, [
    data.proposal_module,
    data.id,
    normalizeProposalStatus(data.status),
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

// ON CONFLICT DO UPDATE (not DO NOTHING): when a governance proposal swaps
// proposal modules (execute_update_proposal_modules), the dump_state
// refresh stubs a row for the new module BEFORE its instantiate event is
// processed — the instantiate must then fill in module_type/config/etc.
// COALESCE keeps a re-run (e.g. the one-shot snapshot after a prior live
// index) from wiping already-populated columns with NULLs when a lookup
// (dao_core dump_state, config query) came back empty. created_at /
// block_height / pre_propose_module are intentionally untouched — the
// original stamps win and pre_propose_module is wired separately via
// updateDaoProposalModulePreProposeModule once the FK target row exists.
const createDaoProposalModuleSql = `
INSERT INTO dao_proposal_module (
  address, dao_address, module_type, prefix, status, created_at, block_height,
  proposal_creation_policy, config
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (address) DO UPDATE SET
  dao_address = COALESCE(EXCLUDED.dao_address, dao_proposal_module.dao_address),
  module_type = COALESCE(EXCLUDED.module_type, dao_proposal_module.module_type),
  prefix = COALESCE(EXCLUDED.prefix, dao_proposal_module.prefix),
  status = COALESCE(EXCLUDED.status, dao_proposal_module.status),
  proposal_creation_policy = COALESCE(
    EXCLUDED.proposal_creation_policy,
    dao_proposal_module.proposal_creation_policy
  ),
  config = COALESCE(EXCLUDED.config, dao_proposal_module.config);
`;

export const createDaoProposalModule = async (
  data: DaoProposalModule
): Promise<void> => {
  await dbQuery(createDaoProposalModuleSql, [
    data.address,
    data.dao_address,
    data.module_type,
    data.prefix ?? null,
    data.status ?? null,
    data.created_at,
    data.block_height,
    data.proposal_creation_policy
      ? JSON.stringify(data.proposal_creation_policy)
      : null,
    data.config ? JSON.stringify(data.config) : null,
  ]);
};

// Refresh prefix/status from the parent DAO's proposal_modules list.
// Called on update_proposal_modules events (and could be called proactively
// when a sibling module changes status).
const updateDaoProposalModulePrefixStatusSql = `
UPDATE dao_proposal_module SET prefix = $2, status = $3 WHERE address = $1;
`;
export const updateDaoProposalModulePrefixStatus = async (data: {
  address: string;
  prefix?: string;
  status?: string;
}): Promise<void> => {
  await dbQuery(updateDaoProposalModulePrefixStatusSql, [
    data.address,
    data.prefix ?? null,
    data.status ?? null,
  ]);
};

const updateDaoProposalModulePreProposeModuleSql = `
UPDATE dao_proposal_module SET pre_propose_module = $2 WHERE address = $1;
`;

export const updateDaoProposalModulePreProposeModule = async (data: {
  address: string;
  // Nullable so we can clear the pointer when the proposal_creation_policy
  // is switched to AnyoneMayPropose (no pre-propose module).
  pre_propose_module: string | null;
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

// v2.7.1 replaced the pre-propose config's `open_proposal_submission`
// boolean with a structured `submission_policy`:
//   { "anyone":   { denylist: [...] } }                              — open
//   { "specific": { dao_members, allowlist, denylist } }             — gated
// We store submission_policy verbatim (JSONB) and keep the legacy boolean
// column populated so old API consumers keep working: legacy configs still
// provide the boolean directly; for v2.7.1 configs we derive it
// (anyone → true, specific → false).
export const deriveOpenProposalSubmission = (
  open_proposal_submission: boolean | undefined | null,
  submission_policy: any
): boolean => {
  if (typeof open_proposal_submission === "boolean") {
    return open_proposal_submission;
  }
  if (submission_policy && typeof submission_policy === "object") {
    return "anyone" in submission_policy;
  }
  return false;
};

export type DaoPreProposeModule = {
  address: string;
  proposal_module: string;
  deposit_info?: any;
  // Legacy (v2.0.3) configs carry the boolean; v2.7.1 configs omit it and
  // carry submission_policy instead — the stored boolean is then derived.
  open_proposal_submission?: boolean;
  // v2.7.1 structured policy; null/undefined for legacy configs.
  submission_policy?: any;
  created_at: Date;
  block_height: number;
};

const createDaoPreProposeModuleSql = `
INSERT INTO dao_pre_propose_module (
  address, proposal_module, deposit_info,
  open_proposal_submission, submission_policy, created_at, block_height
) VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (address) DO NOTHING;
`;

export const createDaoPreProposeModule = async (
  data: DaoPreProposeModule
): Promise<void> => {
  await dbQuery(createDaoPreProposeModuleSql, [
    data.address,
    data.proposal_module,
    data.deposit_info ? JSON.stringify(data.deposit_info) : null,
    deriveOpenProposalSubmission(
      data.open_proposal_submission,
      data.submission_policy
    ),
    data.submission_policy ? JSON.stringify(data.submission_policy) : null,
    data.created_at,
    data.block_height,
  ]);
};

const updateDaoPreProposeModuleSql = `
UPDATE dao_pre_propose_module SET
  deposit_info = $2,
  open_proposal_submission = $3,
  submission_policy = $4
WHERE address = $1;
`;

export const updateDaoPreProposeModule = async (data: {
  address: string;
  deposit_info?: any;
  open_proposal_submission?: boolean;
  submission_policy?: any;
}): Promise<void> => {
  await dbQuery(updateDaoPreProposeModuleSql, [
    data.address,
    data.deposit_info ? JSON.stringify(data.deposit_info) : null,
    deriveOpenProposalSubmission(
      data.open_proposal_submission,
      data.submission_policy
    ),
    data.submission_policy ? JSON.stringify(data.submission_policy) : null,
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

// =============================================
// DAO Core: pause state
// =============================================
export const updateDaoCorePausedUntil = async (data: {
  address: string;
  paused_until: Date | null;
}): Promise<void> => {
  await dbQuery(
    "UPDATE dao_core SET paused_until = $2 WHERE address = $1;",
    [data.address, data.paused_until]
  );
};

// =============================================
// DAO Sub-DAOs
// =============================================
// Reconcile the full sub-DAO list against on-chain state. The chain stores
// it as a Map<Addr, Option<charter>> and the execute event doesn't tell us
// the *delta* — we re-query ListSubDaos to be authoritative.
export const replaceDaoSubDaos = async (
  dao_address: string,
  sub_daos: Array<{ addr: string; charter?: string | null }>,
  updated_at: Date,
  block_height: number
): Promise<void> => {
  // Wipe + insert in one transaction-ish flow; the table is small and
  // governance-paced, so a full replace is simpler than diffing.
  await dbQuery("DELETE FROM dao_sub_dao WHERE dao_address = $1;", [
    dao_address,
  ]);
  for (const s of sub_daos) {
    await dbQuery(
      `INSERT INTO dao_sub_dao
         (dao_address, sub_dao_address, charter, updated_at, block_height)
       VALUES ($1, $2, $3, $4, $5);`,
      [dao_address, s.addr, s.charter ?? null, updated_at, block_height]
    );
  }
};

// =============================================
// Proposal Hooks / Vote Hooks
// =============================================
export const addDaoProposalHook = async (data: {
  proposal_module: string;
  hook_address: string;
  created_at: Date;
  block_height: number;
}): Promise<void> => {
  await dbQuery(
    `INSERT INTO dao_proposal_hook
       (proposal_module, hook_address, created_at, block_height)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (proposal_module, hook_address) DO NOTHING;`,
    [data.proposal_module, data.hook_address, data.created_at, data.block_height]
  );
};

export const removeDaoProposalHook = async (
  proposal_module: string,
  hook_address: string
): Promise<void> => {
  await dbQuery(
    "DELETE FROM dao_proposal_hook WHERE proposal_module = $1 AND hook_address = $2;",
    [proposal_module, hook_address]
  );
};

export const addDaoVoteHook = async (data: {
  proposal_module: string;
  hook_address: string;
  created_at: Date;
  block_height: number;
}): Promise<void> => {
  await dbQuery(
    `INSERT INTO dao_vote_hook
       (proposal_module, hook_address, created_at, block_height)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (proposal_module, hook_address) DO NOTHING;`,
    [data.proposal_module, data.hook_address, data.created_at, data.block_height]
  );
};

export const removeDaoVoteHook = async (
  proposal_module: string,
  hook_address: string
): Promise<void> => {
  await dbQuery(
    "DELETE FROM dao_vote_hook WHERE proposal_module = $1 AND hook_address = $2;",
    [proposal_module, hook_address]
  );
};

// =============================================
// Staking Claims (cw20-stake / native-stake / cw721-stake)
// =============================================
export type DaoStakingClaimKind = "cw20" | "native" | "cw721";

export const insertDaoStakingClaim = async (data: {
  kind: DaoStakingClaimKind;
  staking_contract: string;
  staker_address: string;
  amount?: string | null;
  token_id?: string | null;
  release_at?: Date | null;
  unstaked_at_height: number;
}): Promise<void> => {
  await dbQuery(
    `INSERT INTO dao_staking_claim
       (kind, staking_contract, staker_address, amount, token_id,
        release_at, unstaked_at_height)
     VALUES ($1, $2, $3, $4, $5, $6, $7);`,
    [
      data.kind,
      data.staking_contract,
      data.staker_address,
      data.amount ?? null,
      data.token_id ?? null,
      data.release_at ?? null,
      data.unstaked_at_height,
    ]
  );
};

// Consume all pending claims for this (contract, staker) up to the given
// block time. The contract's execute_claim drains the entire eligible
// queue in one call, so we mark every matching pending row as claimed
// rather than trying to match the specific amounts (which would be
// fragile — claim amounts are aggregated on-chain).
export const markDaoStakingClaimsClaimed = async (
  kind: DaoStakingClaimKind,
  staking_contract: string,
  staker_address: string,
  claimed_at: Date,
  claimed_at_height: number
): Promise<void> => {
  await dbQuery(
    `UPDATE dao_staking_claim
       SET claimed_at = $4, claimed_at_height = $5
     WHERE kind = $1
       AND staking_contract = $2
       AND staker_address = $3
       AND claimed_at IS NULL
       AND (release_at IS NULL OR release_at <= $4);`,
    [kind, staking_contract, staker_address, claimed_at, claimed_at_height]
  );
};

// =============================================
// Pre-Propose Approval lifecycle
// =============================================
export const createDaoPrePropseApproval = async (data: {
  pre_propose_module: string;
  approval_id: number | string;
  proposer: string;
  submitted_at: Date;
  submitted_at_height: number;
}): Promise<void> => {
  await dbQuery(
    `INSERT INTO dao_pre_propose_approval
       (pre_propose_module, approval_id, proposer, status,
        submitted_at, submitted_at_height)
     VALUES ($1, $2, $3, 'pending', $4, $5)
     ON CONFLICT (pre_propose_module, approval_id) DO NOTHING;`,
    [
      data.pre_propose_module,
      data.approval_id,
      data.proposer,
      data.submitted_at,
      data.submitted_at_height,
    ]
  );
};

// =============================================
// DAODAO snapshot state (single-row table)
// =============================================
export const getDaodaoSnapshotState = async (): Promise<
  | {
      network: string;
      cutoff_height: number;
      snapshot_height: number;
      started_at: Date;
      completed_at: Date | null;
    }
  | null
> => {
  const r = await dbQuery(
    "SELECT network, cutoff_height, snapshot_height, started_at, completed_at FROM daodao_snapshot_state WHERE id = 1;"
  );
  return (r.rows[0] as any) ?? null;
};

export const startDaodaoSnapshot = async (data: {
  network: string;
  cutoff_height: number;
  snapshot_height: number;
}): Promise<void> => {
  await dbQuery(
    `INSERT INTO daodao_snapshot_state
       (id, network, cutoff_height, snapshot_height, started_at)
     VALUES (1, $1, $2, $3, NOW())
     ON CONFLICT (id) DO UPDATE SET
       network = EXCLUDED.network,
       cutoff_height = EXCLUDED.cutoff_height,
       snapshot_height = EXCLUDED.snapshot_height,
       started_at = NOW(),
       completed_at = NULL;`,
    [data.network, data.cutoff_height, data.snapshot_height]
  );
};

export const finishDaodaoSnapshot = async (counts: {
  dao_core_count: number;
  voting_module_count: number;
  proposal_module_count: number;
  proposals_count: number;
}): Promise<void> => {
  await dbQuery(
    `UPDATE daodao_snapshot_state SET
       completed_at = NOW(),
       dao_core_count = $1,
       voting_module_count = $2,
       proposal_module_count = $3,
       proposals_count = $4
     WHERE id = 1;`,
    [
      counts.dao_core_count,
      counts.voting_module_count,
      counts.proposal_module_count,
      counts.proposals_count,
    ]
  );
};

// =============================================
// Snapshot helpers: list daodao contracts from wasm_instantiate
// =============================================
// Returns addresses grouped by contract_type for the snapshot routine to
// walk. Filters to only the daodao code_ids passed in (the caller derives
// these from DAODAO_CONTRACT_CODE_IDS).
export const listDaodaoContractsByType = async (
  codeIdToType: Map<number, string>
): Promise<Array<{ address: string; code_id: number; contract_type: string }>> => {
  const codeIds = Array.from(codeIdToType.keys());
  if (codeIds.length === 0) return [];
  const result = await dbQuery(
    "SELECT address, code_id FROM wasm_instantiate WHERE code_id = ANY($1::int[]) ORDER BY block_height ASC, address ASC;",
    [codeIds]
  );
  return result.rows.map((r: any) => ({
    address: r.address,
    code_id: r.code_id,
    contract_type: codeIdToType.get(r.code_id) ?? "",
  }));
};

// Has this proposal already been indexed? Used to dedupe in the snapshot
// (some proposals may have been created post-cutoff already by the live
// indexer if it ran beyond cutoff at some prior deployment).
export const hasDaoProposal = async (
  proposal_module: string,
  id: number | string
): Promise<boolean> => {
  const r = await dbQuery(
    "SELECT 1 FROM dao_proposal WHERE proposal_module = $1 AND id = $2;",
    [proposal_module, id]
  );
  return r.rows.length > 0;
};

export const resolveDaoPrePropseApproval = async (data: {
  pre_propose_module: string;
  approval_id: number | string;
  status: "approved" | "rejected";
  proposal_id?: number | string | null;
  resolved_at: Date;
  resolved_at_height: number;
}): Promise<void> => {
  await dbQuery(
    `UPDATE dao_pre_propose_approval
       SET status = $3,
           proposal_id = $4,
           resolved_at = $5,
           resolved_at_height = $6
     WHERE pre_propose_module = $1 AND approval_id = $2;`,
    [
      data.pre_propose_module,
      data.approval_id,
      data.status,
      data.proposal_id ?? null,
      data.resolved_at,
      data.resolved_at_height,
    ]
  );
};
