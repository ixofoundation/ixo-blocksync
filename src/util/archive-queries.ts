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
