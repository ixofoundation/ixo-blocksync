import { getWasmAttr } from "../util/helpers";
import { isDeterministicWasmParseError } from "../util/archive-api";
import { DelayedFunction } from "./event_sync";
import { EventCore } from "../postgres/blocksync_core/block";
import { isDaodaoIndexable } from "../constants/daodao_cutoff";
import {
  createDaoCore,
  updateDaoCore,
  createDaoProposal,
  updateDaoProposalStatus,
  createDaoVote,
  createDaoProposalModule,
  createDaoVotingModule,
  createDaoPreProposeModule,
  updateDaoCoreAdminAddress,
  updateDaoCoreVotingModule,
  updateDaoVotingModuleGroupContractAddress,
  updateDaoProposalModulePreProposeModule,
  hasDaoPreProposeModule,
  updateDaoPreProposeModule,
  updateDaoProposalModuleConfig,
  updateDaoProposalModuleProposalCreationPolicy,
  updateDaoProposalStatusAndVotes,
  updateDaoVotingModuleTotalWeight,
  ensureDaoCw4GroupContract,
  ensureDaoCw20StakingContract,
  batchUpdateDaoCw4Members,
  upsertDaoCw20Staker,
  upsertDaoNativeStaker,
  updateDaoVotingModuleTokenContractAddress,
  updateDaoVotingModuleTokenStakingContractAddress,
  getDaoCw20StakerStakedAmount,
  deleteDaoCw20Staker,
  updateDaoVotingModuleThreshold,
  updateDaoVotingModuleUnstakingDuration,
  batchInsertDaoCw721Stakers,
  getDaoCw721StakeCount,
  getDaoNativeStakerStakedAmount,
  deleteDaoNativeStaker,
  getDaoVotingModuleTotalWeight,
  updateDaoAllVotingModulesUnstakingDurationForCw20Contract,
  updateDaoAllVotingModulesTotalWeightForCw20Contract,
  getDaoCw20StakersSumStakedForContract,
  updateDaoAllVotingModulesTotalWeightForGroupContract,
  getDaoCw4SumWeightForGroupContract,
  upsertDaoCoreItem,
  deleteDaoCoreItem,
  refreshDaoProposalModulesFromDumpState,
  updateDaoCorePausedUntil,
  replaceDaoSubDaos,
  addDaoProposalHook,
  removeDaoProposalHook,
  addDaoVoteHook,
  removeDaoVoteHook,
  insertDaoStakingClaim,
  markDaoStakingClaimsClaimed,
  createDaoPrePropseApproval,
  resolveDaoPrePropseApproval,
} from "../postgres/dao";
import {
  daoCoreDumpStateQuery,
  daoCoreListSubDaosQuery,
  daoPreProposalModuleConfigQuery,
  daoProposalModuleConfigQuery,
  daoProposalModuleProposalCreationPolicyQuery,
  daoVoteInfoQuery,
  daoProposalInfoQuery,
  cw4GroupMembersQuery,
  cw20StakeConfigQuery,
  daoVotingModuleActiveThresholdQuery,
  cw721StakeConfigQuery,
  cw721StakeStakedNftsQuery,
  nativeStakeConfigQuery,
  cwStakingClaimsQuery,
  cw721NftClaimsQuery,
  daoPrePropseApprovalPendingQuery,
} from "../util/archive-queries";

// =============================================
// Staking claim release_at helper
// =============================================
// cw_controllers::Claim.release_at is `Expiration` which CosmWasm
// serializes as `{ "at_time": "<ns-since-epoch>" }` or
// `{ "at_height": <block> }`. We can only translate at_time to a
// wall-clock — at_height we'd need to project future block timing.
const releaseAtToDate = (
  releaseAt: { at_time?: string; at_height?: number } | undefined
): Date | null => {
  if (!releaseAt) return null;
  if (releaseAt.at_time) {
    return new Date(Math.floor(Number(releaseAt.at_time) / 1_000_000));
  }
  return null;
};

type ProcessDaoEventParams = {
  event: EventCore;
  timestamp: Date;
  contractInfo: { contractType: string; daoAddress?: string };
  blockHeight: number;
  action: string;
};

export const processDaoEvent = async (
  p: ProcessDaoEventParams,
): Promise<void | DelayedFunction> => {
  // Pre-cutoff guard: cosmwasm smart-queries panic for blocks before the
  // chain's wasm upgrade height. Skip the daodao handlers entirely so we
  // don't bring down the indexer; the post-cutoff snapshot run will
  // backfill the affected DAOs' state from chain at the cutoff height.
  if (!isDaodaoIndexable(p.blockHeight)) return;
  try {
    switch (p.contractInfo.contractType) {
      case "dao_core":
        return await processDaoCoreEvent(p);

      case "dao_proposal_single":
      case "dao_proposal_multiple":
      case "dao_proposal_condorcet":
        return await processDaoProposalEvent(p);

      case "dao_voting_cw20_staked":
      case "dao_voting_cw721_staked":
      case "dao_voting_cw4":
      case "dao_voting_native_staked":
        return await processDaoVotingEvent(p);

      case "dao_pre_propose_single":
      case "dao_pre_propose_multiple":
      case "dao_pre_propose_approval_single":
      case "dao_pre_propose_approval_multiple":
      // The approver contract is itself a pre-propose module on the approver
      // DAO's proposal module — it MUST get a dao_pre_propose_module row or
      // the proposal module's pre_propose_module FK breaks on wire-up.
      case "dao_pre_propose_approver":
        return await processDaoPreProposeEvent(p);

      case "cw20_stake":
        return await processCw20StakeEvent(p);

      case "cw4_group":
        return await processCw4GroupEvent(p);

      case "cw20_stake_external_rewards":
      case "cw20_stake_reward_distributor":
      case "cw_fund_distributor":
      case "cw_token_swap":
      case "cw_admin_factory":
      case "cw_payroll_factory":
      case "dao_migrator":
      case "cw_vesting":
      case "cw20_base":
      case "cw721_base":
      case "wasmswap":
        // We dont have or need handling for these contracts yet
        break;

      default:
        break;
    }
  } catch (error) {
    // A bricked contract (stored state unparseable by its live code, e.g. a
    // proposal module in-place-migrated across a schema change — seen on
    // devnet Aug 2026) fails this event's queries deterministically at this
    // height forever; rethrowing would crash-loop the whole indexer on one
    // poison event. Skip JUST this event and keep syncing — the rest of the
    // block is unaffected. Every other error still aborts the block.
    if (isDeterministicWasmParseError(error)) {
      console.error(
        `SKIP::processDaoEvent:: deterministic wasm parse failure — skipping ` +
          `${p.action} on ${p.contractInfo.contractType} ` +
          `${getWasmAttr(p.event.attributes, "_contract_address", true)} at ` +
          `height ${p.blockHeight}: ${error.message}`,
      );
      return;
    }
    console.error("ERROR::processDaoEvent:: ", error.message);
    throw error;
  }
};

// =============================================
// DAO Core Events
// =============================================
const processDaoCoreEvent = async ({
  event,
  timestamp,
  action,
  blockHeight,
}: ProcessDaoEventParams): Promise<void> => {
  const contractAddress = getWasmAttr(event.attributes, "_contract_address");

  switch (action) {
    case "instantiate":
      const conf1 = await daoCoreDumpStateQuery(blockHeight, contractAddress);
      await createDaoCore({
        address: contractAddress,
        name: conf1.config.name,
        description: conf1.config.description,
        image_url: conf1.config.image_url,
        automatically_add_cw20s: conf1.config.automatically_add_cw20s,
        automatically_add_cw721s: conf1.config.automatically_add_cw721s,
        dao_uri: conf1.config.dao_uri,
        admin_address: conf1.admin,
        created_at: timestamp,
        block_height: blockHeight,
      });
      break;

    case "execute_update_config":
      const conf2 = await daoCoreDumpStateQuery(blockHeight, contractAddress);
      await updateDaoCore({
        address: contractAddress,
        name: conf2.config.name,
        description: conf2.config.description,
        image_url: conf2.config.image_url,
        automatically_add_cw20s: conf2.config.automatically_add_cw20s,
        automatically_add_cw721s: conf2.config.automatically_add_cw721s,
        dao_uri: conf2.config.dao_uri,
      });
      break;

    case "execute_accept_admin_nomination":
      await updateDaoCoreAdminAddress({
        address: contractAddress,
        admin_address: getWasmAttr(event.attributes, "new_admin", true),
      });
      break;

    case "execute_set_item": {
      // dao-core emits { action, key, addr } where `addr` carries the
      // value (named that way historically because the original use case
      // was storing contract addresses on the DAO). Stored verbatim.
      const key = getWasmAttr(event.attributes, "key", true);
      const value = getWasmAttr(event.attributes, "addr", true);
      if (key) {
        await upsertDaoCoreItem({
          dao_address: contractAddress,
          key,
          value: value ?? "",
          updated_at: timestamp,
          block_height: blockHeight,
        });
      }
      break;
    }

    case "execute_remove_item": {
      // dao-core emits { action, key } only — drop the row.
      const key = getWasmAttr(event.attributes, "key", true);
      if (key) {
        await deleteDaoCoreItem(contractAddress, key);
      }
      break;
    }

    case "execute_update_proposal_modules": {
      // Governance added/disabled proposal modules. Re-query dump_state
      // and upsert the prefix+status of every module the DAO now reports.
      // Brand-new modules are already listed by dump_state at this height
      // even though their instantiate events only arrive later in the same
      // tx — the upsert stubs their rows (address/dao_address/prefix/
      // status) and processDaoProposalEvent.instantiate fills in the rest.
      const conf = await daoCoreDumpStateQuery(blockHeight, contractAddress);
      const mods = (conf?.proposal_modules ?? []) as Array<{
        address: string;
        prefix?: string;
        status?: string;
      }>;
      if (mods.length) {
        await refreshDaoProposalModulesFromDumpState(
          mods,
          contractAddress,
          timestamp,
          blockHeight,
        );
      }
      break;
    }

    case "execute_pause": {
      // dao-core emits attrs { until: "<expiration>" } where expiration is
      // either "expiration: AtTime <ns>" or "expiration: AtHeight <h>" via
      // cw_utils::Expiration::Display. Re-querying dump_state.pause_info
      // gives us the structured form which is easier to interpret —
      // pause_info is either { unpaused: {} } or
      // { paused: { expiration: { at_time: "<ns>" } | { at_height: N } } }.
      const conf = await daoCoreDumpStateQuery(blockHeight, contractAddress);
      const pauseInfo = conf?.pause_info;
      let pausedUntil: Date | null = null;
      const atTimeNs = pauseInfo?.paused?.expiration?.at_time;
      if (atTimeNs) {
        // Cosmos AtTime expiration is nanoseconds-since-unix-epoch.
        pausedUntil = new Date(Math.floor(Number(atTimeNs) / 1_000_000));
      }
      // at_height we can't translate to a wall-clock time without
      // knowing future block timing; we leave pausedUntil NULL in that
      // case and the next dump_state on unpause will clear it anyway.
      await updateDaoCorePausedUntil({
        address: contractAddress,
        paused_until: pausedUntil,
      });
      break;
    }

    case "execute_withdraw_admin_nomination": {
      // The pending admin nomination is dropped on the chain (removed
      // from NOMINATED_ADMIN storage). We don't model the nomination as
      // its own table today, so there's nothing to update — but we
      // intentionally branch here so the action isn't silently dropped
      // by the default fall-through (and so future tracking of nominee
      // state has an obvious home).
      break;
    }

    case "execute_update_sub_daos_list": {
      // The event doesn't carry the to_add/to_remove lists, so we
      // re-query list_sub_daos and replace the row set. Governance-paced
      // so the full-replace is cheaper than diffing.
      const subDaos = await daoCoreListSubDaosQuery(blockHeight, contractAddress);
      await replaceDaoSubDaos(contractAddress, subDaos, timestamp, blockHeight);
      break;
    }

    // Other dao-core actions we don't currently model (execute_admin_msgs,
    // execute_proposal_hook, update_cw20_list, update_cw721_list,
    // receive_cw20, receive_cw721, etc.) are intentionally dropped.
  }

  // Non action updates:
  // =============================================
  // Update voting and proposal modules if they are set
  const votingModule = getWasmAttr(event.attributes, "voting_module", true);
  if (votingModule) {
    return await updateDaoCoreVotingModule({
      address: contractAddress,
      voting_module: votingModule,
    });
  }

  const proposalModule = getWasmAttr(event.attributes, "prop_module", true);
  if (proposalModule) {
    // Individual proposal modules are handled separately
    // since DAOs can have multiple proposal modules with different statuses
    // So no handling is needed here
  }
};

// =============================================
// DAO Proposal Events
// =============================================
const processDaoProposalEvent = async ({
  event,
  timestamp,
  contractInfo,
  blockHeight,
  action,
}: ProcessDaoEventParams): Promise<void> => {
  const contractAddress = getWasmAttr(event.attributes, "_contract_address");

  switch (action) {
    case "instantiate":
      const conf1 = await daoProposalModuleConfigQuery(
        blockHeight,
        contractAddress,
      );
      const conf2 = await daoProposalModuleProposalCreationPolicyQuery(
        blockHeight,
        contractAddress,
      );
      // Look up this module's prefix + status in the parent dao_core's
      // dump_state.proposal_modules list. The dao_core registers each
      // proposal module before dispatching the instantiate sub-msg, so by
      // the time we run the query at end-of-block the entry is there.
      // Single-module DAOs always come back as prefix="A", status="enabled";
      // multi-module DAOs get distinct prefixes and may have entries
      // marked "disabled" once execute_update_proposal_modules is wired.
      const daoAddr = getWasmAttr(event.attributes, "dao", true);
      let prefix: string | undefined;
      let status: string | undefined;
      if (daoAddr) {
        try {
          const dump = await daoCoreDumpStateQuery(blockHeight, daoAddr);
          const mod = (dump?.proposal_modules ?? []).find(
            (m: any) => m.address === contractAddress,
          );
          prefix = mod?.prefix;
          status = mod?.status;
        } catch (e) {
          // dao_core lookup failure is non-fatal — leave columns null.
        }
      }
      await createDaoProposalModule({
        address: contractAddress,
        module_type: contractInfo.contractType,
        dao_address: daoAddr,
        prefix,
        status,
        created_at: timestamp,
        block_height: blockHeight,
        config: conf1,
        proposal_creation_policy: conf2,
      });
      break;

    case "update_config":
      const conf = await daoProposalModuleConfigQuery(
        blockHeight,
        contractAddress,
      );
      await updateDaoProposalModuleConfig({
        address: contractAddress,
        config: conf,
      });
      break;
    case "update_proposal_creation_policy":
      const conf3 = await daoProposalModuleProposalCreationPolicyQuery(
        blockHeight,
        contractAddress,
      );
      await updateDaoProposalModuleProposalCreationPolicy({
        address: contractAddress,
        proposal_creation_policy: conf3,
      });
      // Keep pre_propose_module column in sync with the new policy.
      //   { module: { addr: X } } → set to X
      //   { anyone: {} }          → set to NULL (no pre-propose module)
      // The end-of-block policy can name a module whose row does NOT exist
      // yet: within an update_pre_propose_config tx this event precedes the
      // new module's instantiate event, so writing the FK here would crash
      // the sync. When the row is missing, defer — the contract guarantees
      // (v2.0.3 and v2.7.x, both reply arms) that whenever the stored policy
      // ends up Module{addr}, the instantiation reply fired a later
      // `update_pre_propose_module=<addr>` event in the SAME tx, and the
      // no-action update path further down wires the FK once the row exists.
      const newPreProposeAddr = conf3?.module?.addr ?? null;
      if (newPreProposeAddr && !(await hasDaoPreProposeModule(newPreProposeAddr))) {
        console.log(
          `DEFER::processDaoProposalEvent:: pre_propose_module ${newPreProposeAddr} ` +
            `for ${contractAddress} at height ${blockHeight} not indexed yet — ` +
            `deferring FK write to the update_pre_propose_module event later in this tx`,
        );
        break;
      }
      await updateDaoProposalModulePreProposeModule({
        address: contractAddress,
        pre_propose_module: newPreProposeAddr,
      });
      break;

    case "propose":
      const id = getWasmAttr(event.attributes, "proposal_id", true);
      const prop = await daoProposalInfoQuery(
        blockHeight,
        contractAddress,
        parseInt(id),
      );
      await createDaoProposal({
        id: id,
        proposal_module: contractAddress,
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
        created_at: timestamp,
        block_height: blockHeight,
      });
      break;

    case "vote":
    case "update_rationale":
      const vote = await daoVoteInfoQuery(
        blockHeight,
        contractAddress,
        parseInt(getWasmAttr(event.attributes, "proposal_id", true)),
        getWasmAttr(event.attributes, "sender", true),
      );
      // dao-proposal-single returns vote.vote as a plain string
      // ("yes"|"no"|"abstain"). dao-proposal-multiple / -condorcet return
      // a `MultipleChoiceVote { option_id: u32 }` object. Normalize to a
      // string so the TEXT column stays human-readable in both cases.
      // The action attribute `position` on multi-choice vote events also
      // carries the option_id as a string, so this lines up with what the
      // contract logs.
      const voteValue =
        vote && typeof vote.vote === "object" && vote.vote !== null
          ? String(vote.vote.option_id ?? "")
          : vote?.vote;
      await createDaoVote({
        proposal_module: contractAddress,
        proposal_id: getWasmAttr(event.attributes, "proposal_id", true),
        voter: vote.voter,
        vote: voteValue,
        rationale: vote.rationale,
        voted_at: timestamp,
        block_height: blockHeight,
        power: vote.power,
      });

      // if action is vote then update proposal status and votes, for only rational update this not needed
      if (action !== "update_rationale") {
        // Get proposal latest status and vote count
        const prop1 = await daoProposalInfoQuery(
          blockHeight,
          contractAddress,
          parseInt(getWasmAttr(event.attributes, "proposal_id", true)),
        );
        await updateDaoProposalStatusAndVotes({
          proposal_module: contractAddress,
          id: getWasmAttr(event.attributes, "proposal_id", true),
          status: prop1.status,
          votes: prop1.votes,
        });
      }
      break;

    case "execute":
    case "close":
    // v2.7.1: a vetoer vetoed the proposal (either during the veto
    // timelock or an open proposal with early-veto enabled). Re-query the
    // proposal at height and mirror its new status — normally "vetoed",
    // or "executed"/"closed" when the veto config routes it there.
    // Status normalization (incl. the object-shaped
    // { veto_timelock: {...} } status) happens in updateDaoProposalStatus.
    case "veto":
      const prop2 = await daoProposalInfoQuery(
        blockHeight,
        contractAddress,
        parseInt(getWasmAttr(event.attributes, "proposal_id", true)),
      );
      await updateDaoProposalStatus({
        proposal_module: contractAddress,
        id: getWasmAttr(event.attributes, "proposal_id", true),
        status: prop2.status,
      });
      break;

    case "add_proposal_hook": {
      const hookAddress = getWasmAttr(event.attributes, "address", true);
      if (hookAddress) {
        await addDaoProposalHook({
          proposal_module: contractAddress,
          hook_address: hookAddress,
          created_at: timestamp,
          block_height: blockHeight,
        });
      }
      break;
    }

    case "remove_proposal_hook": {
      const hookAddress = getWasmAttr(event.attributes, "address", true);
      if (hookAddress) {
        await removeDaoProposalHook(contractAddress, hookAddress);
      }
      break;
    }

    case "add_vote_hook": {
      const hookAddress = getWasmAttr(event.attributes, "address", true);
      if (hookAddress) {
        await addDaoVoteHook({
          proposal_module: contractAddress,
          hook_address: hookAddress,
          created_at: timestamp,
          block_height: blockHeight,
        });
      }
      break;
    }

    case "remove_vote_hook": {
      const hookAddress = getWasmAttr(event.attributes, "address", true);
      if (hookAddress) {
        await removeDaoVoteHook(contractAddress, hookAddress);
      }
      break;
    }

    // Handle other proposal events...
  }

  // Non action updates:
  // =============================================
  // Update pre-propose module if it is set
  const preProposeModule = getWasmAttr(
    event.attributes,
    "update_pre_propose_module",
    true,
  );
  if (preProposeModule) {
    // First update the proposal_creation_policy
    const conf3 = await daoProposalModuleProposalCreationPolicyQuery(
      blockHeight,
      contractAddress,
    );
    await updateDaoProposalModuleProposalCreationPolicy({
      address: contractAddress,
      proposal_creation_policy: conf3,
    });
    // Then update the pre-propose module directly
    return await updateDaoProposalModulePreProposeModule({
      address: contractAddress,
      pre_propose_module: preProposeModule,
    });
  }
};

// =============================================
// DAO Voting Module Events
// =============================================
const processDaoVotingEvent = async ({
  event,
  timestamp,
  contractInfo,
  blockHeight,
  action,
}: ProcessDaoEventParams): Promise<void> => {
  const contractAddress = getWasmAttr(event.attributes, "_contract_address");

  switch (action) {
    case "instantiate":
      let totalWeight = 0;
      let activeThreshold: any = null;
      let nativeDenom: any = null;
      let unstakingDuration: any = null;

      // We can query the below from chain as even though the event hasn't happened yet in list of events, at the end of the block the info is on chain for that block height
      if (contractInfo.contractType === "dao_voting_cw20_staked") {
        activeThreshold = await daoVotingModuleActiveThresholdQuery(
          blockHeight,
          contractAddress,
        );
      }
      if (contractInfo.contractType === "dao_voting_cw721_staked") {
        const cw721Config = await cw721StakeConfigQuery(
          blockHeight,
          contractAddress,
        );
        unstakingDuration = cw721Config?.unstaking_duration;
      }
      if (contractInfo.contractType === "dao_voting_native_staked") {
        const nativeConfig = await nativeStakeConfigQuery(
          blockHeight,
          contractAddress,
        );
        nativeDenom = nativeConfig?.denom;
        unstakingDuration = nativeConfig?.unstaking_duration;
      }
      await createDaoVotingModule({
        address: contractAddress,
        module_type: contractInfo.contractType,
        created_at: timestamp,
        block_height: blockHeight,
        active_threshold: activeThreshold,
        nft_contract: getWasmAttr(event.attributes, "nft_contract", true),
        unstaking_duration: unstakingDuration,
        total_weight: totalWeight.toString(),
        native_denom: nativeDenom,
      });
      break;

    case "update_active_threshold":
      if (contractInfo.contractType === "dao_voting_cw20_staked") {
        const activeThreshold = await daoVotingModuleActiveThresholdQuery(
          blockHeight,
          contractAddress,
        );
        await updateDaoVotingModuleThreshold({
          address: contractAddress,
          active_threshold: activeThreshold,
        });
      }
      break;

    case "update_config":
      if (contractInfo.contractType === "dao_voting_cw721_staked") {
        const cw721Config = await cw721StakeConfigQuery(
          blockHeight,
          contractAddress,
        );
        await updateDaoVotingModuleUnstakingDuration({
          address: contractAddress,
          unstaking_duration: cw721Config?.unstaking_duration,
        });
      }
      if (contractInfo.contractType === "dao_voting_native_staked") {
        const nativeConfig = await nativeStakeConfigQuery(
          blockHeight,
          contractAddress,
        );
        await updateDaoVotingModuleUnstakingDuration({
          address: contractAddress,
          unstaking_duration: nativeConfig?.unstaking_duration,
        });
      }
      break;

    case "stake":
      if (contractInfo.contractType === "dao_voting_cw721_staked") {
        const from = getWasmAttr(event.attributes, "from", true);
        const stakedNfts = await cw721StakeStakedNftsQuery(
          blockHeight,
          contractAddress,
          from,
        );
        await batchInsertDaoCw721Stakers({
          voting_module_address: contractAddress,
          address: from,
          ids: stakedNfts,
          delete_first: false,
        });
        // Then update total_weight in dao_voting_module table
        const totalNftsStaked = await getDaoCw721StakeCount(contractAddress);
        await updateDaoVotingModuleTotalWeight({
          address: contractAddress,
          total_weight: totalNftsStaked.toString(),
        });
      }
      if (contractInfo.contractType === "dao_voting_native_staked") {
        const from = getWasmAttr(event.attributes, "from", true);
        const amount = parseInt(getWasmAttr(event.attributes, "amount", true));
        const stakedAmount1 = parseInt(
          await getDaoNativeStakerStakedAmount(contractAddress, from),
        );
        await upsertDaoNativeStaker({
          voting_module_address: contractAddress,
          staker_address: from,
          staked_amount: (stakedAmount1 + amount).toString(),
        });
        // Then update total_weight in dao_voting_module table
        const oldTotalWeight =
          await getDaoVotingModuleTotalWeight(contractAddress);
        const newTotalWeight = oldTotalWeight + amount;
        await updateDaoVotingModuleTotalWeight({
          address: contractAddress,
          total_weight: newTotalWeight.toString(),
        });
      }
      break;

    case "unstake":
      if (contractInfo.contractType === "dao_voting_cw721_staked") {
        const from = getWasmAttr(event.attributes, "from", true);
        const stakedNfts = await cw721StakeStakedNftsQuery(
          blockHeight,
          contractAddress,
          from,
        );
        await batchInsertDaoCw721Stakers({
          voting_module_address: contractAddress,
          address: from,
          ids: stakedNfts,
          delete_first: true,
        });
        // Then update total_weight in dao_voting_module table
        const totalNftsStaked = await getDaoCw721StakeCount(contractAddress);
        await updateDaoVotingModuleTotalWeight({
          address: contractAddress,
          total_weight: totalNftsStaked.toString(),
        });
        // Record the queued NFT claims. cw721 NftClaims is per-token, so a
        // single unstake of N tokens enqueues N entries — we re-query the
        // claims list and insert any not-yet-recorded entries.
        const claimDuration = getWasmAttr(
          event.attributes,
          "claim_duration",
          true,
        );
        if (claimDuration && claimDuration !== "None") {
          const nftClaims = await cw721NftClaimsQuery(
            blockHeight,
            contractAddress,
            from,
          );
          // Any claims with the latest release_at belong to this unstake.
          // We over-insert defensively with ON-DOES-NOT-MATTER semantics —
          // there's no unique key beyond the synthetic id, so dedupe by
          // looking at this height + staker + token_id when querying.
          for (const c of nftClaims) {
            await insertDaoStakingClaim({
              kind: "cw721",
              staking_contract: contractAddress,
              staker_address: from,
              token_id: c.token_id,
              release_at: releaseAtToDate(c.release_at),
              unstaked_at_height: blockHeight,
            });
          }
        }
      }
      if (contractInfo.contractType === "dao_voting_native_staked") {
        const from = getWasmAttr(event.attributes, "from", true);
        const amount = parseInt(getWasmAttr(event.attributes, "amount", true));
        const stakedAmount1 = parseInt(
          await getDaoNativeStakerStakedAmount(contractAddress, from),
        );
        const newStakedAmount = stakedAmount1 - amount;
        if (!newStakedAmount) {
          await deleteDaoNativeStaker(contractAddress, from);
        } else {
          await upsertDaoNativeStaker({
            voting_module_address: contractAddress,
            staker_address: from,
            staked_amount: newStakedAmount.toString(),
          });
        }
        // Then update total_weight in dao_voting_module table
        const oldTotalWeight =
          await getDaoVotingModuleTotalWeight(contractAddress);
        const newTotalWeight = oldTotalWeight - amount;
        await updateDaoVotingModuleTotalWeight({
          address: contractAddress,
          total_weight: newTotalWeight.toString(),
        });
        // Queue an entry into the claims table if the contract has a
        // non-None unstaking_duration. Identical pattern to cw20-stake.
        const claimDuration = getWasmAttr(
          event.attributes,
          "claim_duration",
          true,
        );
        if (claimDuration && claimDuration !== "None") {
          const claims = await cwStakingClaimsQuery(
            blockHeight,
            contractAddress,
            from,
          );
          const newest = claims[claims.length - 1];
          if (newest) {
            await insertDaoStakingClaim({
              kind: "native",
              staking_contract: contractAddress,
              staker_address: from,
              amount: newest.amount,
              release_at: releaseAtToDate(newest.release_at),
              unstaked_at_height: blockHeight,
            });
          }
        }
      }
      break;

    case "claim": {
      // dao-voting-native-staked emits `claim` with { from, amount }.
      // cw20-stake also uses this action but is handled in
      // processCw20StakeEvent (different dispatch path because the
      // cw20-stake contract is its own contract-type).
      if (contractInfo.contractType === "dao_voting_native_staked") {
        const from = getWasmAttr(event.attributes, "from", true);
        if (from) {
          await markDaoStakingClaimsClaimed(
            "native",
            contractAddress,
            from,
            timestamp,
            blockHeight,
          );
        }
      }
      break;
    }

    case "claim_nfts": {
      // dao-voting-cw721-staked emits this on NFT claim drain.
      if (contractInfo.contractType === "dao_voting_cw721_staked") {
        const from = getWasmAttr(event.attributes, "from", true);
        if (from) {
          await markDaoStakingClaimsClaimed(
            "cw721",
            contractAddress,
            from,
            timestamp,
            blockHeight,
          );
        }
      }
      break;
    }

    // Handle other voting module events...
  }

  // No-action updates:
  // =============================================
  // A single wasm event from a voting-module contract can emit any of
  // group_contract_address / token_address / staking_contract — and the
  // ExistingTokenAndStaking instantiation path emits BOTH token_address
  // and staking_contract on the same event. Process all three in sequence
  // (no early returns) so none gets dropped.

  const groupContractAddress = getWasmAttr(
    event.attributes,
    "group_contract_address",
    true,
  );
  if (groupContractAddress) {
    const totalWeight =
      await getDaoCw4SumWeightForGroupContract(groupContractAddress);
    await updateDaoVotingModuleTotalWeight({
      address: contractAddress,
      total_weight: totalWeight.toString(),
    });
    await updateDaoVotingModuleGroupContractAddress({
      address: contractAddress,
      group_contract_address: groupContractAddress,
    });
  }

  const tokenContractAddress = getWasmAttr(
    event.attributes,
    "token_address",
    true,
  );
  if (tokenContractAddress) {
    await updateDaoVotingModuleTokenContractAddress({
      address: contractAddress,
      token_address: tokenContractAddress,
    });
  }

  const tokenStakingContractAddress = getWasmAttr(
    event.attributes,
    "staking_contract",
    true,
  );
  if (tokenStakingContractAddress) {
    // ExistingStaking case: the cw20-stake was deployed outside this DAO's
    // instantiate tx so we may have never seen its `instantiate` event.
    // Pre-register it so the FK from dao_voting_module.staking_contract
    // resolves.
    await ensureDaoCw20StakingContract(tokenStakingContractAddress);
    // Set this voting module's staking_contract column FIRST so the
    // "update all voting modules where staking_contract = X" calls below
    // actually match this row. Without this ordering, the row still has
    // staking_contract=NULL from createDaoVotingModule and the totals never
    // settle until the next stake event (which never fires in the
    // ExistingTokenAndStaking case where tokens were staked before the DAO
    // came online).
    await updateDaoVotingModuleTokenStakingContractAddress({
      address: contractAddress,
      staking_contract: tokenStakingContractAddress,
    });
    const stakingConfig = await cw20StakeConfigQuery(
      blockHeight,
      tokenStakingContractAddress,
    );
    await updateDaoAllVotingModulesUnstakingDurationForCw20Contract(
      tokenStakingContractAddress,
      stakingConfig?.unstaking_duration,
    );
    const totalWeight = await getDaoCw20StakersSumStakedForContract(
      tokenStakingContractAddress,
    );
    await updateDaoAllVotingModulesTotalWeightForCw20Contract(
      tokenStakingContractAddress,
      totalWeight.toString(),
    );
  }
};

// =============================================
// DAO Pre-Propose Events
// =============================================
const processDaoPreProposeEvent = async ({
  event,
  timestamp,
  contractInfo,
  blockHeight,
  action,
}: ProcessDaoEventParams): Promise<void> => {
  const contractAddress = getWasmAttr(event.attributes, "_contract_address");

  switch (action) {
    // v2.0.3 configs carry `open_proposal_submission` (boolean); v2.7.1
    // replaced it with `submission_policy` ({ anyone: ... } | { specific:
    // ... }). Both are passed through — the postgres layer stores
    // submission_policy verbatim and derives the legacy boolean when only
    // the policy exists (anyone → true, specific → false).
    case "instantiate":
      const conf1 = await daoPreProposalModuleConfigQuery(
        blockHeight,
        contractAddress,
      );
      await createDaoPreProposeModule({
        address: contractAddress,
        proposal_module: getWasmAttr(event.attributes, "proposal_module", true),
        deposit_info: conf1.deposit_info,
        open_proposal_submission: conf1.open_proposal_submission,
        submission_policy: conf1.submission_policy,
        created_at: timestamp,
        block_height: blockHeight,
      });
      break;

    case "update_config":
      const config = await daoPreProposalModuleConfigQuery(
        blockHeight,
        contractAddress,
      );
      await updateDaoPreProposeModule({
        address: contractAddress,
        deposit_info: config.deposit_info,
        open_proposal_submission: config.open_proposal_submission,
        submission_policy: config.submission_policy,
      });
      break;
  }

  // ---------------------------------------------------------------
  // dao-pre-propose-approval-single/-multiple lifecycle.
  //
  // These contracts use `method` instead of `action` for their custom events
  // (legacy convention from dao-pre-propose-base). Both variants emit the
  // exact same attributes (verified in v2.7.1 contract.rs of each):
  //   - method=pre-propose         { id }      — pending submission
  //   - method=proposal_approved   { approval_id, proposal_id }
  //   - method=proposal_rejected   { proposal, deposit_info }
  //
  // We only enter this path for the approval contract types — the regular
  // pre-propose contracts don't carry these methods, so an unconditional
  // method-read would still be safe but is unnecessary.
  if (
    contractInfo.contractType === "dao_pre_propose_approval_single" ||
    contractInfo.contractType === "dao_pre_propose_approval_multiple"
  ) {
    const method = getWasmAttr(event.attributes, "method", true);
    switch (method) {
      case "pre-propose": {
        const approvalIdStr = getWasmAttr(event.attributes, "id", true);
        // The event only carries the approval_id; the proposer is the
        // tx sender which doesn't make it into the wasm event. Query the
        // chain for the freshly-saved PendingProposal entry — it stores
        // the proposer address verbatim.
        if (approvalIdStr) {
          const pending = await daoPrePropseApprovalPendingQuery(
            blockHeight,
            contractAddress,
            parseInt(approvalIdStr)
          );
          if (pending?.proposer) {
            await createDaoPrePropseApproval({
              pre_propose_module: contractAddress,
              approval_id: approvalIdStr,
              proposer: pending.proposer,
              submitted_at: timestamp,
              submitted_at_height: blockHeight,
            });
          }
        }
        break;
      }
      case "proposal_approved": {
        const approvalIdStr = getWasmAttr(event.attributes, "approval_id", true);
        const proposalIdStr = getWasmAttr(event.attributes, "proposal_id", true);
        if (approvalIdStr) {
          await resolveDaoPrePropseApproval({
            pre_propose_module: contractAddress,
            approval_id: approvalIdStr,
            status: "approved",
            proposal_id: proposalIdStr ?? null,
            resolved_at: timestamp,
            resolved_at_height: blockHeight,
          });
        }
        break;
      }
      case "proposal_rejected": {
        // The rejected variant uses `proposal` for the approval_id (the
        // contract uses inconsistent attribute names — see contract.rs
        // line 223 `add_attribute("proposal", id.to_string())`).
        const approvalIdStr = getWasmAttr(event.attributes, "proposal", true);
        if (approvalIdStr) {
          await resolveDaoPrePropseApproval({
            pre_propose_module: contractAddress,
            approval_id: approvalIdStr,
            status: "rejected",
            proposal_id: null,
            resolved_at: timestamp,
            resolved_at_height: blockHeight,
          });
        }
        break;
      }
    }
  }
};

// =============================================
// CW20 Stake Events
// =============================================
// For now we only care about the total weight of the staking contract, thus the total
// staked amount, in future we can add all events to store staking history
const processCw20StakeEvent = async ({
  event,
  timestamp,
  blockHeight,
  action,
}: ProcessDaoEventParams): Promise<void> => {
  const contractAddress = getWasmAttr(event.attributes, "_contract_address");

  switch (action) {
    case "stake":
      const stakeAmount = parseInt(
        getWasmAttr(event.attributes, "amount", true),
      );
      const stakeFrom = getWasmAttr(event.attributes, "from", true);
      const stakedAmount1 = parseInt(
        await getDaoCw20StakerStakedAmount(contractAddress, stakeFrom),
      );
      const totalWeightBefore =
        await getDaoCw20StakersSumStakedForContract(contractAddress);

      await upsertDaoCw20Staker({
        staking_contract: contractAddress,
        staker_address: stakeFrom,
        staked_amount: (stakedAmount1 + stakeAmount).toString(),
      });
      // Update the total weight for all voting modules using this cw20 staking contract
      await updateDaoAllVotingModulesTotalWeightForCw20Contract(
        contractAddress,
        (totalWeightBefore + stakeAmount).toString(),
      );
      break;

    case "unstake":
      const unstakeAmount = parseInt(
        getWasmAttr(event.attributes, "amount", true),
      );
      const unstakeFrom = getWasmAttr(event.attributes, "from", true);
      const stakedAmount2 = parseInt(
        await getDaoCw20StakerStakedAmount(contractAddress, unstakeFrom),
      );
      const newStakedAmount = stakedAmount2 - unstakeAmount;
      const totalWeightBefore1 =
        await getDaoCw20StakersSumStakedForContract(contractAddress);

      if (!newStakedAmount) {
        await deleteDaoCw20Staker(contractAddress, unstakeFrom);
      } else {
        await upsertDaoCw20Staker({
          staking_contract: contractAddress,
          staker_address: unstakeFrom,
          staked_amount: newStakedAmount.toString(),
        });
      }
      // Update the total weight for all voting modules using this cw20 staking contract
      await updateDaoAllVotingModulesTotalWeightForCw20Contract(
        contractAddress,
        (totalWeightBefore1 - unstakeAmount).toString(),
      );
      // If the staking contract has an unstaking_duration configured the
      // unstake amount is queued into CLAIMS rather than being transferred
      // immediately. claim_duration="None" on the event means no queue
      // entry was created. We diff the chain's claims list against what
      // we already have rather than just appending — the queued list is
      // append-only on chain so the highest-release_at row that's not yet
      // in our table is the one this unstake just created.
      {
        const claimDuration = getWasmAttr(
          event.attributes,
          "claim_duration",
          true,
        );
        if (claimDuration && claimDuration !== "None") {
          const claims = await cwStakingClaimsQuery(
            blockHeight,
            contractAddress,
            unstakeFrom,
          );
          // Newest claim is the one we just created. (cw_controllers
          // appends in order; release_at for the latest entry will be
          // strictly >= existing entries when duration is positive.)
          const newest = claims[claims.length - 1];
          if (newest) {
            await insertDaoStakingClaim({
              kind: "cw20",
              staking_contract: contractAddress,
              staker_address: unstakeFrom,
              amount: newest.amount,
              release_at: releaseAtToDate(newest.release_at),
              unstaked_at_height: blockHeight,
            });
          }
        }
      }
      break;

    case "update_config":
      const stakingConfig = await cw20StakeConfigQuery(
        blockHeight,
        contractAddress,
      );
      await updateDaoAllVotingModulesUnstakingDurationForCw20Contract(
        contractAddress,
        stakingConfig.unstaking_duration,
      );
      break;

    case "claim": {
      const claimFrom = getWasmAttr(event.attributes, "from", true);
      if (claimFrom) {
        await markDaoStakingClaimsClaimed(
          "cw20",
          contractAddress,
          claimFrom,
          timestamp,
          blockHeight,
        );
      }
      break;
    }

    default:
      break;
  }
};

// =============================================
// CW4 Group Events
// =============================================
const processCw4GroupEvent = async ({
  event,
  blockHeight,
  action,
}: ProcessDaoEventParams): Promise<void> => {
  const contractAddress = getWasmAttr(event.attributes, "_contract_address");

  switch (action) {
    case "update_members":
      // Refresh all members from the group contract since we don't get any data in
      // events on changes so have to do it manually
      const membersData = await cw4GroupMembersQuery(
        blockHeight,
        contractAddress,
      );

      if (membersData?.length > 0) {
        await batchUpdateDaoCw4Members(contractAddress, membersData);
      }

      // Then update total_weight in all dao_voting_module tables
      const totalWeight = membersData.reduce(
        (acc, member) => acc + member.weight,
        0,
      );
      await updateDaoAllVotingModulesTotalWeightForGroupContract(
        contractAddress,
        totalWeight.toString(),
      );
      break;
    default:
      break;
  }
};

// =============================================
// DAODAO instantiate events
// =============================================
export const processDaodaoInstantiateEvent = async ({
  contractAddress,
  contractType,
  blockHeight,
}: {
  contractAddress: string;
  contractType: string;
  blockHeight: number;
}): Promise<void> => {
  // Same pre-cutoff guard as processDaoEvent — this handler hits the chain
  // to pre-populate cw4 members and cw20-stake state, which panics pre-cutoff.
  if (!isDaodaoIndexable(blockHeight)) return;
  switch (contractType) {
    case "cw4_group":
      await ensureDaoCw4GroupContract(contractAddress);
      // Get all members from the group contract
      const membersData = await cw4GroupMembersQuery(
        blockHeight,
        contractAddress,
      );
      if (membersData?.length > 0) {
        await batchUpdateDaoCw4Members(contractAddress, membersData);
      }
      break;
    case "cw20_stake":
      await ensureDaoCw20StakingContract(contractAddress);
      // Can't be initialized with stakes so no need for initializeVotingModuleMembers
      break;
    case "dao_voting_cw4":
    case "dao_voting_cw721_staked":
    // Both these is linked to the voting module itself so no need for separate table
    default:
      break;
  }
};
