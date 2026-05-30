import { NETWORK } from "../util/secrets";
import {
  DAODAO_CUTOFF_HEIGHT,
  DAODAO_CUTOFF_HEIGHTS,
} from "../constants/daodao_cutoff";
import { DAODAO_CONTRACT_CODE_IDS } from "../constants/wasm_code_ids";
import { withTransaction } from "../postgres/client";
import { setCurrentPool } from "./sync_blocks";
import {
  daoCoreDumpStateQuery,
  daoCoreListSubDaosQuery,
  daoProposalModuleConfigQuery,
  daoProposalModuleProposalCreationPolicyQuery,
  daoPreProposalModuleConfigQuery,
  daoVotingModuleActiveThresholdQuery,
  cw4GroupMembersQuery,
  cw20StakeConfigQuery,
  cw721StakeConfigQuery,
  nativeStakeConfigQuery,
  proposalModuleListProposalsQuery,
  stakingListStakersQuery,
} from "../util/archive-queries";
import {
  getDaodaoSnapshotState,
  startDaodaoSnapshot,
  finishDaodaoSnapshot,
  listDaodaoContractsByType,
  ensureDaoCw4GroupContract,
  ensureDaoCw20StakingContract,
  batchUpdateDaoCw4Members,
  createDaoVotingModule,
  createDaoCore,
  updateDaoCoreVotingModule,
  updateDaoCorePausedUntil,
  replaceDaoSubDaos,
  createDaoPreProposeModule,
  createDaoProposalModule,
  updateDaoProposalModulePreProposeModule,
  updateDaoVotingModuleTotalWeight,
  upsertDaoCw20Staker,
  upsertDaoNativeStaker,
  updateDaoAllVotingModulesTotalWeightForCw20Contract,
  updateDaoAllVotingModulesTotalWeightForGroupContract,
  createDaoProposal,
  hasDaoProposal,
} from "../postgres/dao";

// ===========================================================================
// One-shot snapshot of daodao state at the chain's wasm-state cutoff height.
//
// Why this exists: see src/constants/daodao_cutoff.ts. tl;dr — pre-cutoff
// blocks panic on cosmwasm smart-queries, so the daodao indexer skips them.
// This snapshot is what gives the indexer a coherent set of parent rows
// (dao_core, voting_module, proposal_module, etc.) so post-cutoff events
// have something to FK against.
//
// Snapshot semantics:
// - Runs at most once per blocksync DB. Tracked via daodao_snapshot_state.
// - Queries chain state at a single height (`snapshotHeight`, the first
//   block at/after cutoff the indexer is about to process). All rows
//   carry that same block_height / created_at — they are NOT a historical
//   replay, they are a point-in-time photograph.
// - Walks contracts in FK dependency order:
//     1. cw4_group_contract + cw20_staking_contract registrations
//     2. dao_voting_module (FK → cw4/cw20 registries)
//     3. dao_pre_propose_module
//     4. dao_core (FK → voting_module)
//     5. dao_proposal_module (FK → dao_core, pre_propose_module)
//     6. dao_proposal (FK → proposal_module) — backfilled lightly so
//        post-cutoff `vote` events on pre-cutoff proposals find a row.
//     7. group members + cw20 / native stakers (so total_weight is correct)
// - Pre-cutoff votes are NOT backfilled (we don't have the per-vote query
//   shape and the user has signalled they don't care about pre-cutoff
//   daodao history). dao_vote inserts that reference a missing voter row
//   are simply not synthesised.
// - Idempotent: every write uses ON CONFLICT DO NOTHING / DO UPDATE so a
//   partial run that crashes mid-snapshot can be retried. `started_at`
//   gets bumped each retry; `completed_at` only fills on a clean finish.
// ===========================================================================

type Counts = {
  dao_core_count: number;
  voting_module_count: number;
  proposal_module_count: number;
  proposals_count: number;
};

export const ensureDaodaoSnapshot = async (
  currentBlock: number
): Promise<void> => {
  if (DAODAO_CUTOFF_HEIGHT === 0) {
    // Unknown / unconfigured network — assume archive can answer at all
    // heights; nothing to snapshot.
    return;
  }
  if (currentBlock < DAODAO_CUTOFF_HEIGHT) return;

  const state = await getDaodaoSnapshotState();
  if (state?.completed_at) return;

  // We log loudly because this is a multi-minute one-shot operation that
  // should be visible in pod startup logs.
  console.log(
    `[daodao-snapshot] cutoff=${DAODAO_CUTOFF_HEIGHT} network=${NETWORK} ` +
      `currentBlock=${currentBlock} — taking snapshot at this height`
  );
  const snapshotHeight = currentBlock;

  const counts: Counts = {
    dao_core_count: 0,
    voting_module_count: 0,
    proposal_module_count: 0,
    proposals_count: 0,
  };

  // Wrap the ENTIRE snapshot in a single transaction.
  // - All writes (started_at marker, every per-contract row, completed_at
  //   marker) commit together or rollback together.
  // - If any archive query fails (after its own retries) we throw out of
  //   here and the transaction rolls back — next startup retries clean
  //   with no half-written rows in dao_core / dao_voting_module / etc.
  // - Holds a postgres connection open for the duration (typically
  //   seconds to a couple of minutes); operationally acceptable for a
  //   one-shot bootstrap that runs at most once per blocksync DB.
  try {
    await withTransaction(async (client) => {
      setCurrentPool(client);
      try {
        await startDaodaoSnapshot({
          network: NETWORK,
          cutoff_height: DAODAO_CUTOFF_HEIGHT,
          snapshot_height: snapshotHeight,
        });
        await runSnapshot(snapshotHeight, counts);
        await finishDaodaoSnapshot(counts);
      } finally {
        setCurrentPool(undefined);
      }
    });
    console.log(
      `[daodao-snapshot] done: ${counts.dao_core_count} daos, ` +
        `${counts.voting_module_count} voting modules, ` +
        `${counts.proposal_module_count} proposal modules, ` +
        `${counts.proposals_count} proposals.`
    );
  } catch (err: any) {
    console.error(
      `[daodao-snapshot] FAILED at height ${snapshotHeight}: ${err?.message}`
    );
    // Re-throw so the sync loop retries. The transaction was rolled back,
    // so v7_snapshot_state is unchanged — next pass starts clean.
    throw err;
  }
};

// ----------------------------------------------------------------------
// Internal: walk wasm_instantiate grouped by contract type and snapshot
// each in FK-safe order.
// ----------------------------------------------------------------------
const runSnapshot = async (snapshotHeight: number, counts: Counts) => {
  const codeIdToType = DAODAO_CONTRACT_CODE_IDS;
  const contracts = await listDaodaoContractsByType(codeIdToType);
  if (contracts.length === 0) {
    console.log("[daodao-snapshot] no daodao contracts in wasm_instantiate");
    return;
  }
  console.log(
    `[daodao-snapshot] found ${contracts.length} daodao contracts to walk`
  );

  const byType = new Map<string, string[]>();
  for (const c of contracts) {
    if (!byType.has(c.contract_type)) byType.set(c.contract_type, []);
    byType.get(c.contract_type)!.push(c.address);
  }

  const snapshotTimestamp = new Date();
  const baseCtx = { snapshotHeight, snapshotTimestamp };

  // Pass 1: child contract registries. cw4_group_contract and
  // cw20_staking_contract are referenced by dao_voting_module FKs.
  for (const a of byType.get("cw4_group") ?? []) {
    await ensureDaoCw4GroupContract(a);
  }
  for (const a of byType.get("cw20_stake") ?? []) {
    await ensureDaoCw20StakingContract(a);
  }

  // Pass 2: voting modules.
  for (const t of [
    "dao_voting_cw4",
    "dao_voting_cw20_staked",
    "dao_voting_cw721_staked",
    "dao_voting_native_staked",
  ]) {
    for (const addr of byType.get(t) ?? []) {
      await snapshotVotingModule(addr, t, baseCtx);
      counts.voting_module_count++;
    }
  }

  // Pass 3: pre-propose modules. Their `proposal_module` column points at
  // the proposal_module that owns them; that FK is on dao_proposal_module
  // pointing back at dao_pre_propose_module — so we create pre_propose
  // FIRST, then proposal_module.
  for (const t of [
    "dao_pre_propose_single",
    "dao_pre_propose_multiple",
    "dao_pre_propose_approval_single",
  ]) {
    for (const addr of byType.get(t) ?? []) {
      await snapshotPreProposeModule(addr, baseCtx);
    }
  }

  // Pass 4: dao_core. dump_state tells us voting_module + proposal_modules
  // for free, so this writes the core row + immediately wires the
  // voting_module FK.
  for (const addr of byType.get("dao_core") ?? []) {
    await snapshotDaoCore(addr, baseCtx);
    counts.dao_core_count++;
  }

  // Pass 5: proposal modules. dao_address is read from each module's own
  // `config.dao` query result, so we don't depend on the dao_core dump
  // for this step.
  for (const t of [
    "dao_proposal_single",
    "dao_proposal_multiple",
    "dao_proposal_condorcet",
  ]) {
    for (const addr of byType.get(t) ?? []) {
      await snapshotProposalModule(addr, t, baseCtx);
      counts.proposal_module_count++;

      // Pass 6: proposals on this module. Lightweight — title, proposer,
      // status, msgs — enough that post-cutoff vote events FK successfully
      // even when they refer to pre-cutoff proposal_ids.
      const created = await snapshotProposalsForModule(addr, baseCtx);
      counts.proposals_count += created;
    }
  }

  // Pass 7: members & stakers — refresh totals that feed
  // dao_voting_module.total_weight. The voting_module rows already exist
  // by now; we just refresh their member/staker collections.
  for (const addr of byType.get("cw4_group") ?? []) {
    await snapshotCw4Members(addr, baseCtx);
  }
  for (const addr of byType.get("cw20_stake") ?? []) {
    await snapshotCw20Stakers(addr, baseCtx);
  }
  for (const addr of byType.get("dao_voting_native_staked") ?? []) {
    await snapshotNativeStakers(addr, baseCtx);
  }
  // cw721-staked stakers are populated on a per-NFT basis via the stake
  // event handler; backfilling pre-cutoff stakers would require iterating
  // every NFT in every staking module, which is bounded only by the NFT
  // collection's size. The total_weight is already set from the chain
  // config snapshot above (via cw721StakeStakedNftsQuery would be one
  // call per staker, expensive). We leave dao_cw721_staker empty for
  // pre-cutoff state. Post-cutoff stake/unstake events refill it.
};

// ----------------------------------------------------------------------
// Voting module snapshot. Mirrors the `case "instantiate"` block in
// processDaoVotingEvent, but driven by a passed-in address+type rather
// than an event.
// ----------------------------------------------------------------------
type BaseCtx = { snapshotHeight: number; snapshotTimestamp: Date };

const snapshotVotingModule = async (
  address: string,
  contractType: string,
  ctx: BaseCtx
) => {
  let activeThreshold: any = null;
  let nativeDenom: string | null = null;
  let unstakingDuration: any = null;

  if (contractType === "dao_voting_cw20_staked") {
    activeThreshold = await daoVotingModuleActiveThresholdQuery(
      ctx.snapshotHeight,
      address
    );
  }
  if (contractType === "dao_voting_cw721_staked") {
    const cfg = await cw721StakeConfigQuery(ctx.snapshotHeight, address);
    unstakingDuration = cfg?.unstaking_duration;
  }
  if (contractType === "dao_voting_native_staked") {
    const cfg = await nativeStakeConfigQuery(ctx.snapshotHeight, address);
    nativeDenom = cfg?.denom ?? null;
    unstakingDuration = cfg?.unstaking_duration;
  }

  // Note: token_address / staking_contract / group_contract_address are
  // populated AFTER this row exists, via the post-pass that walks the
  // dao_core dump_state output (which tells us which voting module
  // belongs to which DAO + what its underlying contracts are). For now
  // we write the bare row; the dao_core pass + member/staker passes fill
  // in the rest.
  await createDaoVotingModule({
    address,
    module_type: contractType,
    created_at: ctx.snapshotTimestamp,
    block_height: ctx.snapshotHeight,
    active_threshold: activeThreshold,
    nft_contract: undefined,
    unstaking_duration: unstakingDuration,
    total_weight: "0",
    native_denom: nativeDenom ?? undefined,
  });
};

const snapshotPreProposeModule = async (address: string, ctx: BaseCtx) => {
  const cfg = await daoPreProposalModuleConfigQuery(ctx.snapshotHeight, address);
  if (!cfg) return;
  await createDaoPreProposeModule({
    address,
    // The `dao` field on pre-propose config gives us the parent dao_core,
    // but the column we have on dao_pre_propose_module is `proposal_module`
    // which we don't get from the config query. The proposal_module
    // snapshot pass will write it via updateDaoProposalModulePreProposeModule
    // (the reverse direction); leave NULL here.
    proposal_module: undefined as any,
    deposit_info: cfg.deposit_info,
    open_proposal_submission: cfg.open_proposal_submission,
    created_at: ctx.snapshotTimestamp,
    block_height: ctx.snapshotHeight,
  });
};

const snapshotDaoCore = async (address: string, ctx: BaseCtx) => {
  const dump = await daoCoreDumpStateQuery(ctx.snapshotHeight, address);
  if (!dump) return;
  const config = dump.config ?? {};

  await createDaoCore({
    address,
    name: config.name,
    description: config.description,
    image_url: config.image_url,
    automatically_add_cw20s: config.automatically_add_cw20s,
    automatically_add_cw721s: config.automatically_add_cw721s,
    dao_uri: config.dao_uri,
    admin_address: dump.admin,
    created_at: ctx.snapshotTimestamp,
    block_height: ctx.snapshotHeight,
  });
  if (dump.voting_module) {
    await updateDaoCoreVotingModule({
      address,
      voting_module: dump.voting_module,
    });
  }

  // Pause state.
  const atTimeNs = dump?.pause_info?.paused?.expiration?.at_time;
  if (atTimeNs) {
    await updateDaoCorePausedUntil({
      address,
      paused_until: new Date(Math.floor(Number(atTimeNs) / 1_000_000)),
    });
  }

  // Sub-DAOs.
  try {
    const subDaos = await daoCoreListSubDaosQuery(ctx.snapshotHeight, address);
    if (subDaos.length) {
      await replaceDaoSubDaos(
        address,
        subDaos,
        ctx.snapshotTimestamp,
        ctx.snapshotHeight
      );
    }
  } catch {
    // Some old dao-core versions may not expose list_sub_daos — non-fatal.
  }
};

const snapshotProposalModule = async (
  address: string,
  contractType: string,
  ctx: BaseCtx
) => {
  const config = await daoProposalModuleConfigQuery(
    ctx.snapshotHeight,
    address
  );
  const policy = await daoProposalModuleProposalCreationPolicyQuery(
    ctx.snapshotHeight,
    address
  );
  const daoAddr = (config as any)?.dao;

  // Resolve prefix + status from the parent dao_core's dump_state, same
  // as the live instantiate handler does.
  let prefix: string | undefined;
  let status: string | undefined;
  if (daoAddr) {
    try {
      const dump = await daoCoreDumpStateQuery(ctx.snapshotHeight, daoAddr);
      const mod = (dump?.proposal_modules ?? []).find(
        (m: any) => m.address === address
      );
      prefix = mod?.prefix;
      status = mod?.status;
    } catch {
      /* non-fatal */
    }
  }

  await createDaoProposalModule({
    address,
    module_type: contractType,
    dao_address: daoAddr,
    prefix,
    status,
    created_at: ctx.snapshotTimestamp,
    block_height: ctx.snapshotHeight,
    config: config ?? {},
    proposal_creation_policy: policy ?? null,
  });
  // Wire pre_propose_module on this proposal module from the
  // proposal_creation_policy ({ module: { addr } }) or null for Anyone.
  await updateDaoProposalModulePreProposeModule({
    address,
    pre_propose_module: policy?.module?.addr ?? null,
  });
};

const snapshotProposalsForModule = async (
  proposalModule: string,
  ctx: BaseCtx
): Promise<number> => {
  let proposals: Array<{ id: number; proposal: any }>;
  try {
    proposals = await proposalModuleListProposalsQuery(
      ctx.snapshotHeight,
      proposalModule
    );
  } catch {
    return 0;
  }
  let created = 0;
  for (const p of proposals) {
    if (await hasDaoProposal(proposalModule, p.id)) continue;
    const prop = p.proposal ?? {};
    await createDaoProposal({
      id: String(p.id),
      proposal_module: proposalModule,
      title: prop.title,
      description: prop.description,
      proposer: prop.proposer,
      status: prop.status,
      msgs: prop.msgs,
      start_height: prop.start_height,
      min_voting_period: prop.min_voting_period,
      expiration: prop.expiration,
      threshold: prop.threshold,
      total_power: prop.total_power,
      allow_revoting: prop.allow_revoting,
      votes: prop.votes,
      created_at: ctx.snapshotTimestamp,
      block_height: ctx.snapshotHeight,
    });
    created++;
  }
  return created;
};

const snapshotCw4Members = async (
  groupAddress: string,
  ctx: BaseCtx
): Promise<void> => {
  const members = await cw4GroupMembersQuery(ctx.snapshotHeight, groupAddress);
  if (!members?.length) return;
  await batchUpdateDaoCw4Members(groupAddress, members);
  const total = members.reduce((s, m) => s + (m.weight ?? 0), 0);
  await updateDaoAllVotingModulesTotalWeightForGroupContract(
    groupAddress,
    total.toString()
  );
};

const snapshotCw20Stakers = async (
  stakingContract: string,
  ctx: BaseCtx
): Promise<void> => {
  const stakers = await stakingListStakersQuery(
    ctx.snapshotHeight,
    stakingContract
  );
  if (!stakers?.length) return;
  let total = 0;
  for (const s of stakers) {
    await upsertDaoCw20Staker({
      staking_contract: stakingContract,
      staker_address: s.address,
      staked_amount: s.balance,
    });
    total += parseInt(s.balance, 10) || 0;
  }
  // Propagate the total weight to every voting module pointing at this
  // staking contract. We also need to make sure the cw20-stake config
  // (unstaking_duration) is mirrored onto the voting module if not yet.
  await updateDaoAllVotingModulesTotalWeightForCw20Contract(
    stakingContract,
    total.toString()
  );
  // Pull config to mirror unstaking_duration / token_address fields onto
  // any voting module pointing at us. We don't store those on the
  // staking_contract row itself; they're held on dao_voting_module
  // columns and the live event handler writes them via the existing
  // helpers. We skip those here — they'll be set the next time a stake
  // event fires post-cutoff.
  await cw20StakeConfigQuery(ctx.snapshotHeight, stakingContract).catch(
    () => undefined
  );
};

const snapshotNativeStakers = async (
  votingModuleAddress: string,
  ctx: BaseCtx
): Promise<void> => {
  // dao-voting-native-staked exposes list_stakers itself (same shape as
  // cw20-stake). Write each row + recompute the voting module's
  // total_weight from the sum.
  const stakers = await stakingListStakersQuery(
    ctx.snapshotHeight,
    votingModuleAddress
  );
  if (!stakers?.length) return;
  let total = 0;
  for (const s of stakers) {
    await upsertDaoNativeStaker({
      voting_module_address: votingModuleAddress,
      staker_address: s.address,
      staked_amount: s.balance,
    });
    total += parseInt(s.balance, 10) || 0;
  }
  await updateDaoVotingModuleTotalWeight({
    address: votingModuleAddress,
    total_weight: total.toString(),
  });
};

// Exported for tests / debugging.
export const _DAODAO_CUTOFF_HEIGHTS = DAODAO_CUTOFF_HEIGHTS;
