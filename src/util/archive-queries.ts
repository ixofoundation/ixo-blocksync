import { queryArchiveApi } from "./archive-api";
import { jsonToBase64 } from "./conversions";

// ==========================================================================================
// Epochs Queries
// ==========================================================================================
export const epochsQuery = async (height: number) => {
  return await queryArchiveApi("/ixo/epochs/v1beta1/epochs", height);
  // Example return
  // {
  //   epochs: [
  //     {
  //       identifier: "day",
  //       start_time: "2025-06-12T16:36:18.462895294Z",
  //       duration: "86400s",
  //       current_epoch: "1",
  //       current_epoch_start_time: "2025-06-12T16:36:18.462895294Z",
  //       epoch_counting_started: true,
  //       current_epoch_start_height: "1",
  //     },
  //     {
  //       identifier: "hour",
  //       start_time: "2025-06-12T16:36:18.462895294Z",
  //       duration: "3600s",
  //       current_epoch: "2",
  //       current_epoch_start_time: "2025-06-12T16:36:18.462895294Z",
  //       epoch_counting_started: true,
  //       current_epoch_start_height: "1",
  //     },
  //     {
  //       identifier: "week",
  //       start_time: "2025-06-12T16:36:18.462895294Z",
  //       duration: "604800s",
  //       current_epoch: "1",
  //       current_epoch_start_time: "2025-06-12T16:36:18.462895294Z",
  //       epoch_counting_started: true,
  //       current_epoch_start_height: "1",
  //     },
  //   ];
  // }
};

// ==========================================================================================
// DAODAO Queries
// ==========================================================================================
// ======================================
// DAODAO Core Queries
// ======================================
export const daoCoreDumpStateQuery = async (
  height: number,
  contractAddress: string
) => {
  const query = jsonToBase64({ dump_state: {} });
  const config = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Example return
  // {
  //     "data": {
  //         "admin": "ixo17p9rzwnnfxcjp32un9ug7yhhzgtkhvl9jfksztgw5uh69wac2pgs5n2tcu",
  //         "config": {
  //             "name": "Test Dao",
  //             "description": "This is a test dao",
  //             "image_url": "https://sienaconstruction.com/wp-content/uploads/2017/05/test-image.jpg",
  //             "automatically_add_cw20s": true,
  //             "automatically_add_cw721s": true,
  //             "dao_uri": null
  //         },
  //         "pause_info": {
  //             "unpaused": {}
  //         },
  //         "version": {
  //             "contract": "crates.io:dao-core",
  //             "version": "2.0.3"
  //         },
  //         "proposal_modules": [
  //             {
  //                 "address": "ixo16yhg0alwt30g7e5pe3jwnn48kywrdry0xknylufv4l27c9s9w0xsuq48qm",
  //                 "prefix": "A",
  //                 "status": "enabled"
  //             }
  //         ],
  //         "voting_module": "ixo1dw7ytajtzutangvv47cjhm8nxh8ak88nn33as9kkqs6f0cpussqsem038e",
  //         "active_proposal_module_count": 1,
  //         "total_proposal_module_count": 1
  //     }
  // }
  return config?.data;
};

// ==========================================================================
// V7 chain-upgrade snapshot helpers
// ==========================================================================
// These query liquidstake + claims state at the v7 upgrade height so the
// indexer can mirror the silent state writes performed by the v7 chain
// migrations (see src/constants/v7_upgrade.ts).

// liquidstake `ModuleParams` query — single global record.
export const liquidStakeModuleParamsQuery = async (
  height: number
): Promise<
  | { min_liquid_stake_amount: string; module_paused: boolean }
  | undefined
> => {
  const r = await queryArchiveApi(
    "/ixo/liquidstake/v1beta1/module_params",
    height
  );
  // Response shape: { module_params: { min_liquid_stake_amount, module_paused } }
  return r?.module_params;
};

// liquidstake `Pools` query — paginated list of every pool.
export const liquidStakePoolsQuery = async (
  height: number
): Promise<
  Array<{
    pool_id: string;
    liquid_bond_denom: string;
    proxy_account_address: string;
    whitelisted_validators: Array<any>;
    unstake_fee_rate: string;
    fee_account_address: string;
    autocompound_fee_rate: string;
    whitelist_admin_address: string;
    paused: boolean;
    weighted_rewards_receivers: Array<any>;
  }>
> => {
  const limit = 100;
  let nextKey: string | undefined = undefined;
  const pools: any[] = [];
  while (true) {
    const path =
      "/ixo/liquidstake/v1beta1/pools" +
      `?pagination.limit=${limit}` +
      (nextKey ? `&pagination.key=${encodeURIComponent(nextKey)}` : "");
    const r = await queryArchiveApi(path, height);
    const batch = (r?.pools ?? []) as any[];
    pools.push(...batch);
    nextKey = r?.pagination?.next_key ?? undefined;
    if (!nextKey || batch.length === 0) break;
  }
  return pools;
};

// claims `Collection` query — fetch a single collection's full state. The
// v7 snapshot uses this to refresh new-in-v7 columns (flagged counters,
// deposit requirements, adjudicators, etc.) on every existing collection
// row. Pre-v7 chain state defaults those fields to zero/empty, so on the
// upgrade block they read back as defaults — but we re-issue the upsert
// to be deterministic about the snapshot's end state.
export const claimsCollectionQuery = async (
  height: number,
  collectionId: string
) => {
  const r = await queryArchiveApi(
    `/ixo/claims/v1beta1/collection/${collectionId}`,
    height
  );
  return r?.collection;
};

// claims `DisputeList` query — paginated list of every dispute on chain
// at a given height. Snapshot uses this to confirm pre-v7 disputes are
// stamped DISMISSED (target_role=UNSPECIFIED → status=DISMISSED), which
// the chain migration does silently.
export const claimsDisputeListQuery = async (
  height: number
): Promise<Array<any>> => {
  const limit = 100;
  let nextKey: string | undefined = undefined;
  const out: any[] = [];
  while (true) {
    const path =
      "/ixo/claims/v1beta1/dispute_list" +
      `?pagination.limit=${limit}` +
      (nextKey ? `&pagination.key=${encodeURIComponent(nextKey)}` : "");
    const r = await queryArchiveApi(path, height);
    const batch = (r?.disputes ?? []) as any[];
    out.push(...batch);
    nextKey = r?.pagination?.next_key ?? undefined;
    if (!nextKey || batch.length === 0) break;
  }
  return out;
};

// Query a single pending proposal on the approval-single pre-propose
// module. The `proposer` field is populated server-side from the message
// sender, so we can't read it from the wasm event attributes — those
// only carry `method`, `id`, `_contract_address`.
export const daoPrePropseApprovalPendingQuery = async (
  height: number,
  contractAddress: string,
  id: number
) => {
  const query = jsonToBase64({
    query_extension: { msg: { pending_proposal: { id } } },
  });
  const result = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Returns: { data: { approval_id, proposer, msg, deposit } }
  return result?.data as
    | { approval_id: number; proposer: string }
    | undefined;
};

// List sub-DAOs registered on this DAO. We need a separate query rather
// than pulling from dump_state because dump_state doesn't include subDAOs
// — they have their own paginated endpoint. We pull a single page large
// enough that production DAOs won't outgrow it; if they ever do, we'd
// need to paginate but that's out of scope here.
export const daoCoreListSubDaosQuery = async (
  height: number,
  contractAddress: string
) => {
  const query = jsonToBase64({ list_sub_daos: { limit: 100 } });
  const result = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Returns: { data: [ { addr: "ixo1...", charter: null | "..." }, ... ] }
  return (result?.data ?? []) as Array<{ addr: string; charter?: string | null }>;
};

// ======================================
// DAODAO Proposal Module Queries
// ======================================
export const daoProposalModuleConfigQuery = async (
  height: number,
  contractAddress: string
) => {
  const query = jsonToBase64({ config: {} });
  const config = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Example return
  // {
  //     "data": {
  //         "threshold": {
  //             "threshold_quorum": {
  //                 "threshold": {
  //                     "majority": {}
  //                 },
  //                 "quorum": {
  //                     "percent": "0.2"
  //                 }
  //             }
  //         },
  //         "max_voting_period": {
  //             "time": 604800
  //         },
  //         "min_voting_period": null,
  //         "only_members_execute": true,
  //         "allow_revoting": false,
  //         "dao": "ixo17p9rzwnnfxcjp32un9ug7yhhzgtkhvl9jfksztgw5uh69wac2pgs5n2tcu",
  //         "close_proposal_on_execution_failure": true
  //     }
  // }
  return config?.data;
};

export const daoProposalModuleProposalCreationPolicyQuery = async (
  height: number,
  contractAddress: string
) => {
  const query = jsonToBase64({ proposal_creation_policy: {} });
  const config = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Example return
  // {
  //     "data": {
  //         "module": {
  //             "addr": "ixo14xc5dkz0rn8j99lxz69mkv3wzawmadg7xurkzy49m9yefmqx5c6srg2qj8"
  //         }
  //     }
  // }
  return config?.data;
};

export const daoPreProposalModuleConfigQuery = async (
  height: number,
  contractAddress: string
) => {
  const query = jsonToBase64({ config: {} });
  const config = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // v2.0.3 example return
  // {
  //     "data": {
  //         "deposit_info": {
  //             "denom": {
  //                 "native": "uixo"
  //             },
  //             "amount": "1000000",
  //             "refund_policy": "only_passed"
  //         },
  //         "open_proposal_submission": false
  //     }
  // }
  //
  // v2.7.1 replaced open_proposal_submission with submission_policy:
  // {
  //     "data": {
  //         "deposit_info": null,
  //         "submission_policy": {
  //             "specific": {
  //                 "dao_members": true,
  //                 "allowlist": [],
  //                 "denylist": []
  //             }
  //         }
  //     }
  // }
  // (or "submission_policy": { "anyone": { "denylist": [] } } for open
  // submission). The full data object is returned unchanged so consumers
  // see whichever fields the contract version provides.
  return config?.data;
};

export const daoProposalInfoQuery = async (
  height: number,
  contractAddress: string,
  proposalId: number
) => {
  const query = jsonToBase64({ proposal: { proposal_id: proposalId } });
  const config = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Example return
  // {
  //     "data": {
  //         "id": 1,
  //         "proposal": {
  //             "title": "Testing",
  //             "description": "Testing: set item whoIsAwesome",
  //             "proposer": "ixo1n8yrmeatsk74dw0zs95ess9sgzptd6thgjgcj2",
  //             "start_height": 512,
  //             "min_voting_period": null,
  //             "expiration": {
  //                 "at_time": "1750352043181224498"
  //             },
  //             "threshold": {
  //                 "threshold_quorum": {
  //                     "threshold": {
  //                         "majority": {}
  //                     },
  //                     "quorum": {
  //                         "percent": "0.2"
  //                     }
  //                 }
  //             },
  //             "total_power": "1",
  //             "msgs": [
  //                 {
  //                     "wasm": {
  //                         "execute": {
  //                             "contract_addr": "ixo17p9rzwnnfxcjp32un9ug7yhhzgtkhvl9jfksztgw5uh69wac2pgs5n2tcu",
  //                             "msg": "eyJzZXRfaXRlbSI6eyJrZXkiOiJ3aG9Jc0F3ZXNvbWUiLCJ2YWx1ZSI6IlBldHJ1cyJ9fQ==",
  //                             "funds": []
  //                         }
  //                     }
  //                 }
  //             ],
  //             "status": "executed",
  //             "votes": {
  //                 "yes": "1",
  //                 "no": "0",
  //                 "abstain": "0"
  //             },
  //             "allow_revoting": false
  //         }
  //     }
  // }
  return config?.data?.proposal;
};

// ======================================
// DAODAO Vote Queries
// ======================================

export const daoVoteInfoQuery = async (
  height: number,
  contractAddress: string,
  proposalId: number,
  voter: string
) => {
  const query = jsonToBase64({
    get_vote: { proposal_id: proposalId, voter: voter },
  });
  const config = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Example return
  // {
  //     "data": {
  //         "vote": {
  //             "voter": "ixo1n8yrmeatsk74dw0zs95ess9sgzptd6thgjgcj2",
  //             "vote": "yes",
  //             "power": "1",
  //             "rationale": null
  //         }
  //     }
  // }
  return config?.data?.vote;
};

// ======================================
// CW4 Group Contract Queries
// ======================================
export const cw4GroupMembersQuery = async (
  height: number,
  contractAddress: string
) => {
  const limit = 100;
  let startAfter = undefined;
  let members: { addr: string; weight: number }[] = [];

  const query = (startAfter?: string) =>
    jsonToBase64({
      list_members: {
        start_after: startAfter,
        limit: limit,
      },
    });

  while (true) {
    const result = await queryArchiveApi(
      `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query(
        startAfter
      )}`,
      height
    );
    if (!result?.data?.members?.length) break;
    members.push(...result.data.members);
    if (result.data.members.length < limit) break;
    startAfter = result.data.members[result.data.members.length - 1].addr;
  }
  // Example return
  // {
  //     "data": {
  //         "members": [
  //             {
  //                 "addr": "ixo1n8yrmeatsk74dw0zs95ess9sgzptd6thgjgcj2",
  //                 "weight": 1
  //             }
  //         ]
  //     }
  // }
  return members;
};

// ======================================
// CW20 Staking Contract Queries
// ======================================
export const cw20StakeConfigQuery = async (
  height: number,
  contractAddress: string
) => {
  const query = jsonToBase64({ get_config: {} });
  const result = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Example return
  // {
  //     "data": {
  //         "token_address": "ixo1r4azksxfmfn3wx6tlazcu5acreymnvyacnu3q33532zdt6ypwmxqnystvl",
  //         "unstaking_duration": {
  //             "time": 240
  //         }
  //     }
  // }
  return result?.data;
};

// ======================================
// Native Staking Contract Queries
// ======================================
export const nativeStakeConfigQuery = async (
  height: number,
  contractAddress: string
) => {
  const query = jsonToBase64({ get_config: {} });
  const result = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Example return
  // {
  //     "data": {
  //         "owner": null,
  //         "manager": null,
  //         "denom": "uixo",
  //         "unstaking_duration": null
  //     }
  // }
  return result?.data;
};

// ======================================
// Voting Module Queries
// ======================================
export const daoVotingModuleActiveThresholdQuery = async (
  height: number,
  contractAddress: string
) => {
  const query = jsonToBase64({ active_threshold: {} });
  const result = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Example return
  // {
  //     "data": {
  //         "active_threshold": null
  //     }
  // }
  return result?.data?.active_threshold;
};

// dao-voting-cw4: GroupContract {} → the cw4-group contract address (Addr).
// The live instantiate handler reads this from the `group_contract_address`
// event attribute; the snapshot has no event, so it queries it directly.
export const daoVotingCw4GroupContractQuery = async (
  height: number,
  contractAddress: string
): Promise<string | null> => {
  const query = jsonToBase64({ group_contract: {} });
  const result = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Example return: { "data": "ixo1...groupcontract" }
  return typeof result?.data === "string" ? result.data : null;
};

// dao-voting-cw20-staked: StakingContract {} → the cw20-stake contract address (Addr).
export const daoVotingCw20StakingContractQuery = async (
  height: number,
  contractAddress: string
): Promise<string | null> => {
  const query = jsonToBase64({ staking_contract: {} });
  const result = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Example return: { "data": "ixo1...stakingcontract" }
  return typeof result?.data === "string" ? result.data : null;
};

// ======================================
// CW721 Staking Queries
// ======================================
export const cw721StakeConfigQuery = async (
  height: number,
  contractAddress: string
) => {
  const query = jsonToBase64({ config: {} });
  const result = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  // Example return
  // {
  //     "data": {
  //         "owner": "ixo1n8yrmeatsk74dw0zs95ess9sgzptd6thgjgcj2",
  //         "nft_address": "ixo1tntx8qvn28nc5kl00ccs8qvtymphgp7zuqd93s30l0cu7mukltdsg2ma0l",
  //         "unstaking_duration": {
  //             "time": 604800
  //         }
  //     }
  // }
  return result?.data;
};

// ======================================
// Snapshot helpers
// ======================================
// Walks a paginated `list_stakers` / `ListStakers` query (used by both
// cw20-stake and dao-voting-native-staked — they share the same
// request/response shape).
export const stakingListStakersQuery = async (
  height: number,
  contractAddress: string
): Promise<Array<{ address: string; balance: string }>> => {
  const limit = 100;
  let startAfter: string | undefined = undefined;
  const stakers: Array<{ address: string; balance: string }> = [];
  while (true) {
    const query = jsonToBase64({
      list_stakers: { start_after: startAfter, limit },
    });
    const result = await queryArchiveApi(
      `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
      height
    );
    const batch = (result?.data?.stakers ?? []) as Array<{
      address: string;
      balance: string;
    }>;
    if (!batch.length) break;
    stakers.push(...batch);
    if (batch.length < limit) break;
    startAfter = batch[batch.length - 1].address;
  }
  return stakers;
};

// Walks a paginated `list_proposals` on a dao-proposal-{single,multiple,
// condorcet} module. We use ascending traversal so callers don't have to
// reverse — proposals are typically iterated oldest-first when backfilling.
export const proposalModuleListProposalsQuery = async (
  height: number,
  contractAddress: string
): Promise<Array<{ id: number; proposal: any }>> => {
  const limit = 30;
  let startAfter: number | undefined = undefined;
  const out: Array<{ id: number; proposal: any }> = [];
  while (true) {
    const query = jsonToBase64({
      list_proposals: { start_after: startAfter, limit },
    });
    const result = await queryArchiveApi(
      `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
      height
    );
    const batch = (result?.data?.proposals ?? []) as Array<{
      id: number;
      proposal: any;
    }>;
    if (!batch.length) break;
    out.push(...batch);
    if (batch.length < limit) break;
    startAfter = batch[batch.length - 1].id;
  }
  return out;
};

// ======================================
// Staking Claims Queries
// ======================================
// cw_controllers::Claims::query_claims returns:
//   { claims: [{ amount: "100", release_at: { at_time: "<ns>" } | { at_height: N } }] }
// Used by cw20-stake and dao-voting-native-staked.
export const cwStakingClaimsQuery = async (
  height: number,
  contractAddress: string,
  address: string
) => {
  const query = jsonToBase64({ claims: { address } });
  const result = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  return (result?.data?.claims ?? []) as Array<{
    amount: string;
    release_at: { at_time?: string; at_height?: number };
  }>;
};

// dao-voting-cw721-staked uses cw721_controllers::NftClaims:
//   { nft_claims: [{ token_id, release_at: ... }] }
export const cw721NftClaimsQuery = async (
  height: number,
  contractAddress: string,
  address: string
) => {
  const query = jsonToBase64({ nft_claims: { address } });
  const result = await queryArchiveApi(
    `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query}`,
    height
  );
  return (result?.data?.nft_claims ?? []) as Array<{
    token_id: string;
    release_at: { at_time?: string; at_height?: number };
  }>;
};

export const cw721StakeStakedNftsQuery = async (
  height: number,
  contractAddress: string,
  address: string
) => {
  const limit = 100;
  let startAfter = undefined;
  let nfts: string[] = [];

  const query = (startAfter?: string) =>
    jsonToBase64({
      staked_nfts: {
        address,
        start_after: startAfter,
        limit: limit,
      },
    });

  while (true) {
    const result = await queryArchiveApi(
      `/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${query(
        startAfter
      )}`,
      height
    );
    if (!result?.data?.length) break;
    nfts.push(...result.data);
    if (result.data.length < limit) break;
    startAfter = result.data[result.data.length - 1];
  }
  // Example return
  // {
  //     "data": [
  //         "NFT ID"
  //     ]
  // }
  return nfts.map((nft) => ({ token_id: nft }));
};

// ==========================================================================================
// Smart Account Queries
// ==========================================================================================
export const smartAccountAuthenticatorQuery = async (
  height: number,
  account: string,
  authenticatorId: string
) => {
  const result = await queryArchiveApi(
    `/ixo/smartaccount/authenticator/${account}/${authenticatorId}`,
    height
  );
  // Example return
  // {
  //     "account_authenticator": {
  //         "id": "1",
  //         "type": "SignatureVerification",
  //         "config": "base64encodedconfig..."
  //     }
  // }
  return result?.account_authenticator;
};

export const smartAccountAuthenticatorsQuery = async (
  height: number,
  account: string
) => {
  const result = await queryArchiveApi(
    `/ixo/smartaccount/authenticators/${account}`,
    height
  );
  // Example return
  // {
  //     "account_authenticators": [
  //         {
  //             "id": "1",
  //             "type": "SignatureVerification",
  //             "config": "base64encodedconfig..."
  //         }
  //     ]
  // }
  return result?.account_authenticators;
};

// ==========================================================================================
// Authz
// ==========================================================================================
export type LcdAuthzGrant = {
  authorization: { "@type": string; [key: string]: any };
  expiration: string | null;
};

// Some environments' "archive" nodes prune historical state down to every
// Nth version — testnet retains one in 100 (verified empirically: every
// multiple-of-100 height serves, everything else returns "failed to load
// state ... version mismatch on immutable IAVL tree"). When an exact-height
// authz query hits such a pruned version, retry at the next RETAINED height:
// exact chain state at most SNAP_INTERVAL-1 blocks later. For the authz
// payload this is sound — constraints converge to latest-known either way,
// and a grant that disappears inside the gap is deleted by its own
// EventRevoke when the sync reaches that block. The snap is authz-only:
// other archive queries (daodao snapshots etc.) need exact heights.
const PRUNED_STATE_RE = /failed to load state at height/i;
const SNAP_INTERVAL = 100;
// Heights known pruned, so repeated events in the same block skip the
// doomed exact query. Grows one entry per pruned claim-block — trivial.
const prunedHeights = new Set<number>();
// Snapped results keyed granter:grantee, scoped to one snap height at a
// time (snap heights are non-decreasing while syncing forward).
let snapCacheHeight = 0;
const snapCache = new Map<string, LcdAuthzGrant[]>();

// All grants for a (granter, grantee) pair at the given height (end-of-block
// state). Used only as the hydration fallback for EventGrants whose payload
// cannot be read from the emitting message (wasm/MsgExec-dispatched grants) —
// height-pinned so historical resyncs hydrate historical state.
export const authzGrantsQuery = async (
  height: number,
  granter: string,
  grantee: string
): Promise<LcdAuthzGrant[]> => {
  const snapped = Math.ceil(height / SNAP_INTERVAL) * SNAP_INTERVAL;
  if (prunedHeights.has(height)) {
    return await authzGrantsAt(snapped, granter, grantee, true);
  }
  try {
    return await authzGrantsAt(height, granter, grantee, false);
  } catch (error: any) {
    if (snapped === height || !PRUNED_STATE_RE.test(error?.message ?? "")) {
      throw error;
    }
    prunedHeights.add(height);
    return await authzGrantsAt(snapped, granter, grantee, true);
  }
};

const authzGrantsAt = async (
  height: number,
  granter: string,
  grantee: string,
  isSnap: boolean
): Promise<LcdAuthzGrant[]> => {
  const cacheKey = `${granter}:${grantee}`;
  if (isSnap) {
    if (height !== snapCacheHeight) {
      snapCache.clear();
      snapCacheHeight = height;
    }
    const cached = snapCache.get(cacheKey);
    if (cached !== undefined) return cached;
  }
  const grants: LcdAuthzGrant[] = [];
  let nextKey: string | undefined = undefined;
  while (true) {
    const path =
      `/cosmos/authz/v1beta1/grants` +
      `?granter=${encodeURIComponent(granter)}` +
      `&grantee=${encodeURIComponent(grantee)}` +
      `&pagination.limit=100` +
      (nextKey ? `&pagination.key=${encodeURIComponent(nextKey)}` : "");
    let r: any;
    try {
      // the snapped height is AHEAD of the block being processed — bypass
      // the shared height-scoped cache so its watermark stays consistent
      // for exact-height consumers (see queryArchiveApi)
      r = await queryArchiveApi(path, height, { bypassCache: isSnap });
    } catch (error: any) {
      // Some SDK versions answer "no grants for this pair" with a NotFound
      // envelope instead of an empty list. Match the specific authz message
      // only — a broader /not found/ would also match an infra 404 and turn
      // an outage into a silent "no grants".
      if (/authorization not found/i.test(error?.message ?? "")) break;
      throw error;
    }
    const batch = (r?.grants ?? []) as LcdAuthzGrant[];
    grants.push(...batch);
    nextKey = r?.pagination?.next_key ?? undefined;
    if (!nextKey || batch.length === 0) break;
  }
  if (isSnap) snapCache.set(cacheKey, grants);
  return grants;
};
