import { getWasmAttr } from "../util/helpers";
import { DelayedFunction } from "./event_sync";
import { EventCore } from "../postgres/blocksync_core/block";
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
} from "../postgres/dao";
import {
  daoCoreDumpStateQuery,
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
} from "../util/archive-queries";

type ProcessDaoEventParams = {
  event: EventCore;
  timestamp: Date;
  contractInfo: { contractType: string; daoAddress?: string };
  blockHeight: number;
  action: string;
};

export const processDaoEvent = async (
  p: ProcessDaoEventParams
): Promise<void | DelayedFunction> => {
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
      case "dao_pre_propose_approver":
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

    // Handle other DAO core events...
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
        contractAddress
      );
      const conf2 = await daoProposalModuleProposalCreationPolicyQuery(
        blockHeight,
        contractAddress
      );
      await createDaoProposalModule({
        address: contractAddress,
        module_type: contractInfo.contractType,
        dao_address: getWasmAttr(event.attributes, "dao", true),
        created_at: timestamp,
        block_height: blockHeight,
        config: conf1,
        proposal_creation_policy: conf2,
      });
      break;

    case "update_config":
      const conf = await daoProposalModuleConfigQuery(
        blockHeight,
        contractAddress
      );
      await updateDaoProposalModuleConfig({
        address: contractAddress,
        config: conf,
      });
      break;
    case "update_proposal_creation_policy":
      const conf3 = await daoProposalModuleProposalCreationPolicyQuery(
        blockHeight,
        contractAddress
      );
      await updateDaoProposalModuleProposalCreationPolicy({
        address: contractAddress,
        proposal_creation_policy: conf3,
      });
      break;

    case "propose":
      const id = getWasmAttr(event.attributes, "proposal_id", true);
      const prop = await daoProposalInfoQuery(
        blockHeight,
        contractAddress,
        parseInt(id)
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
        getWasmAttr(event.attributes, "sender", true)
      );
      await createDaoVote({
        proposal_module: contractAddress,
        proposal_id: getWasmAttr(event.attributes, "proposal_id", true),
        voter: vote.voter,
        vote: vote.vote,
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
          parseInt(getWasmAttr(event.attributes, "proposal_id", true))
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
      const prop2 = await daoProposalInfoQuery(
        blockHeight,
        contractAddress,
        parseInt(getWasmAttr(event.attributes, "proposal_id", true))
      );
      await updateDaoProposalStatus({
        proposal_module: contractAddress,
        id: getWasmAttr(event.attributes, "proposal_id", true),
        status: prop2.status,
      });
      break;

    // Handle other proposal events...
  }

  // Non action updates:
  // =============================================
  // Update pre-propose module if it is set
  const preProposeModule = getWasmAttr(
    event.attributes,
    "update_pre_propose_module",
    true
  );
  if (preProposeModule) {
    // First update the proposal_creation_policy
    const conf3 = await daoProposalModuleProposalCreationPolicyQuery(
      blockHeight,
      contractAddress
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
          contractAddress
        );
      }
      if (contractInfo.contractType === "dao_voting_cw721_staked") {
        const cw721Config = await cw721StakeConfigQuery(
          blockHeight,
          contractAddress
        );
        unstakingDuration = cw721Config?.unstaking_duration;
      }
      if (contractInfo.contractType === "dao_voting_native_staked") {
        const nativeConfig = await nativeStakeConfigQuery(
          blockHeight,
          contractAddress
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
          contractAddress
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
          contractAddress
        );
        await updateDaoVotingModuleUnstakingDuration({
          address: contractAddress,
          unstaking_duration: cw721Config?.unstaking_duration,
        });
      }
      if (contractInfo.contractType === "dao_voting_native_staked") {
        const nativeConfig = await nativeStakeConfigQuery(
          blockHeight,
          contractAddress
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
          from
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
          await getDaoNativeStakerStakedAmount(contractAddress, from)
        );
        await upsertDaoNativeStaker({
          voting_module_address: contractAddress,
          staker_address: from,
          staked_amount: (stakedAmount1 + amount).toString(),
        });
        // Then update total_weight in dao_voting_module table
        const oldTotalWeight = await getDaoVotingModuleTotalWeight(
          contractAddress
        );
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
          from
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
      }
      if (contractInfo.contractType === "dao_voting_native_staked") {
        const from = getWasmAttr(event.attributes, "from", true);
        const amount = parseInt(getWasmAttr(event.attributes, "amount", true));
        const stakedAmount1 = parseInt(
          await getDaoNativeStakerStakedAmount(contractAddress, from)
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
        const oldTotalWeight = await getDaoVotingModuleTotalWeight(
          contractAddress
        );
        const newTotalWeight = oldTotalWeight - amount;
        await updateDaoVotingModuleTotalWeight({
          address: contractAddress,
          total_weight: newTotalWeight.toString(),
        });
      }
      break;

    // Handle other voting module events...
  }

  // No action updates:
  // =============================================
  // Update group contract address if it is set
  const groupContractAddress = getWasmAttr(
    event.attributes,
    "group_contract_address",
    true
  );
  if (groupContractAddress) {
    // Update total weight for this voting module
    const totalWeight = await getDaoCw4SumWeightForGroupContract(
      groupContractAddress
    );
    await updateDaoVotingModuleTotalWeight({
      address: contractAddress,
      total_weight: totalWeight.toString(),
    });
    return await updateDaoVotingModuleGroupContractAddress({
      address: contractAddress,
      group_contract_address: groupContractAddress,
    });
  }

  // Update token contract address if it is set
  const tokenContractAddress = getWasmAttr(
    event.attributes,
    "token_address",
    true
  );
  if (tokenContractAddress) {
    return await updateDaoVotingModuleTokenContractAddress({
      address: contractAddress,
      token_address: tokenContractAddress,
    });
  }

  // Update token staking contract address if it is set
  const tokenStakingContractAddress = getWasmAttr(
    event.attributes,
    "staking_contract",
    true
  );
  if (tokenStakingContractAddress) {
    // Update unstaking duration for all voting modules using this cw20 staking contract
    const stakingConfig = await cw20StakeConfigQuery(
      blockHeight,
      tokenStakingContractAddress
    );
    await updateDaoAllVotingModulesUnstakingDurationForCw20Contract(
      tokenStakingContractAddress,
      stakingConfig.unstaking_duration
    );
    // Update the total weight for this voting module
    const totalWeight = await getDaoCw20StakersSumStakedForContract(
      tokenStakingContractAddress
    );
    await updateDaoAllVotingModulesTotalWeightForCw20Contract(
      tokenStakingContractAddress,
      totalWeight.toString()
    );
    // Update token staking contract address for this voting module
    return await updateDaoVotingModuleTokenStakingContractAddress({
      address: contractAddress,
      staking_contract: tokenStakingContractAddress,
    });
  }
};

// =============================================
// DAO Pre-Propose Events
// =============================================
const processDaoPreProposeEvent = async ({
  event,
  timestamp,
  blockHeight,
  action,
}: ProcessDaoEventParams): Promise<void> => {
  const contractAddress = getWasmAttr(event.attributes, "_contract_address");

  switch (action) {
    case "instantiate":
      const conf1 = await daoPreProposalModuleConfigQuery(
        blockHeight,
        contractAddress
      );
      await createDaoPreProposeModule({
        address: contractAddress,
        proposal_module: getWasmAttr(event.attributes, "proposal_module", true),
        deposit_info: conf1.deposit_info,
        open_proposal_submission: conf1.open_proposal_submission,
        created_at: timestamp,
        block_height: blockHeight,
      });
      break;

    case "update_config":
      const config = await daoPreProposalModuleConfigQuery(
        blockHeight,
        contractAddress
      );
      await updateDaoPreProposeModule({
        address: contractAddress,
        deposit_info: config.deposit_info,
        open_proposal_submission: config.open_proposal_submission,
      });
      break;
  }
};

// =============================================
// CW20 Stake Events
// =============================================
// For now we only care about the total weight of the staking contract, thus the total
// staked amount, in future we can add all events to store staking history
const processCw20StakeEvent = async ({
  event,
  blockHeight,
  action,
}: ProcessDaoEventParams): Promise<void> => {
  const contractAddress = getWasmAttr(event.attributes, "_contract_address");

  switch (action) {
    case "stake":
      const stakeAmount = parseInt(
        getWasmAttr(event.attributes, "amount", true)
      );
      const stakeFrom = getWasmAttr(event.attributes, "from", true);
      const stakedAmount1 = parseInt(
        await getDaoCw20StakerStakedAmount(contractAddress, stakeFrom)
      );
      const totalWeightBefore = await getDaoCw20StakersSumStakedForContract(
        contractAddress
      );

      await upsertDaoCw20Staker({
        staking_contract: contractAddress,
        staker_address: stakeFrom,
        staked_amount: (stakedAmount1 + stakeAmount).toString(),
      });
      // Update the total weight for all voting modules using this cw20 staking contract
      await updateDaoAllVotingModulesTotalWeightForCw20Contract(
        contractAddress,
        (totalWeightBefore + stakeAmount).toString()
      );
      break;

    case "unstake":
      const unstakeAmount = parseInt(
        getWasmAttr(event.attributes, "amount", true)
      );
      const unstakeFrom = getWasmAttr(event.attributes, "from", true);
      const stakedAmount2 = parseInt(
        await getDaoCw20StakerStakedAmount(contractAddress, unstakeFrom)
      );
      const newStakedAmount = stakedAmount2 - unstakeAmount;
      const totalWeightBefore1 = await getDaoCw20StakersSumStakedForContract(
        contractAddress
      );

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
        (totalWeightBefore1 - unstakeAmount).toString()
      );
      break;

    case "update_config":
      const stakingConfig = await cw20StakeConfigQuery(
        blockHeight,
        contractAddress
      );
      await updateDaoAllVotingModulesUnstakingDurationForCw20Contract(
        contractAddress,
        stakingConfig.unstaking_duration
      );
      break;

    case "claim":
      // In future we can add stake history, for now nothing
      break;

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
        contractAddress
      );

      if (membersData?.length > 0) {
        await batchUpdateDaoCw4Members(contractAddress, membersData);
      }

      // Then update total_weight in all dao_voting_module tables
      const totalWeight = membersData.reduce(
        (acc, member) => acc + member.weight,
        0
      );
      await updateDaoAllVotingModulesTotalWeightForGroupContract(
        contractAddress,
        totalWeight.toString()
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
  switch (contractType) {
    case "cw4_group":
      await ensureDaoCw4GroupContract(contractAddress);
      // Get all members from the group contract
      const membersData = await cw4GroupMembersQuery(
        blockHeight,
        contractAddress
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
