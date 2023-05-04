import { Event } from "@ixo/impactxclient-sdk/types/codegen/tendermint/abci/types";
import { TxResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/base/abci/v1beta1/abci";
import { utils } from "@ixo/impactxclient-sdk";
import Long from "long";
import { prisma } from "../prisma/prisma_client";
import { getTokensByEntityId } from "../handlers/token_handler";
import { queryClient, registry } from "../sync/sync_chain";
import { OrderBy } from "../types/Enums";

export interface ConvertedEvent {
  type: string;
  attributes: any[];
}

export const getBlockbyHeight = async (height: number | string) => {
  try {
    const res =
      await queryClient.cosmos.base.tendermint.v1beta1.getBlockByHeight({
        height: Long.fromNumber(Number(height)),
      });
    return res;
  } catch (error) {
    if (error.toString().includes("(18)")) {
      console.log("Waiting for Blocks");
      return;
    }
    console.error(error);
    return;
  }
};

export const getLatestBlock = async () => {
  try {
    const res =
      await queryClient.cosmos.base.tendermint.v1beta1.getLatestBlock();
    return res;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getTxsEvent = async (height: number) => {
  try {
    const res = await queryClient.cosmos.tx.v1beta1.getTxsEvent({
      events: [`tx.height=${height}`],
      orderBy: OrderBy.ORDER_BY_ASC,
    });
    return res;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getBondsInfo = async () => {
  try {
    const res = await queryClient.ixo.bonds.v1beta1.bondsDetailed();
    return res;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getAccountBonds = async (address: string) => {
  try {
    const balances = await queryClient.cosmos.bank.v1beta1.allBalances({
      address: address,
    });
    const denoms: string[] = [];
    for (const balance of balances.balances) {
      denoms.push(balance.denom);
    }
    const bonds = await queryClient.ixo.bonds.v1beta1.bondsDetailed();
    const accountBonds = bonds.bondsDetailed.filter((bond) => {
      const supplyDenom = bond.supply?.denom || "";
      return denoms.includes(supplyDenom);
    });
    const res: any[] = [];
    for (let index = 0; index < accountBonds.length; index++) {
      const bond = (
        await queryClient.ixo.bonds.v1beta1.bond({
          bondDid: accountBonds[index].bondDid,
        })
      ).bond;
      const amount = balances.balances[index].amount;
      const denom = accountBonds[index].supply?.denom;
      const price = accountBonds[index].spotPrice;
      res.push({ bond, amount, denom, price });
    }
    return res;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getAccountEntities = async (address: string) => {
  try {
    let ids: string[] = [];
    let finish = false;
    const entityParams = await queryClient.ixo.entity.v1beta1.params();
    const contractAddress = entityParams.params!.nftContractAddress;

    while (!finish) {
      const msg = {
        tokens: {
          owner: address,
          limit: 30,
          startAfter: null,
        },
      };
      const res = await queryClient.cosmwasm.wasm.v1.smartContractState({
        address: contractAddress,
        queryData: utils.conversions.JsonToArray(JSON.stringify(msg)),
      });
      // console.log("fetched");
      const newIds = JSON.parse(
        utils.conversions.Uint8ArrayToJS(res.data)
      ).tokens;
      ids = ids.concat(newIds);
      // if (newIds.length < 30 || newIds.length === 0) finish = true;
      finish = true;
    }
    return ids;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getAccountTokens = async (address: string) => {
  try {
    const tokenClasses = await prisma.tokenClass.findMany();
    const tokens: any[] = [];
    for (const tokenClass of tokenClasses) {
      const msg = {
        tokens: {
          owner: address,
          limit: 99999999,
        },
      };
      const contractRes = await queryClient.cosmwasm.wasm.v1.smartContractState(
        {
          address: tokenClass.contractAddress,
          queryData: utils.conversions.JsonToArray(JSON.stringify(msg)),
        }
      );
      const res = JSON.parse(
        utils.conversions.Uint8ArrayToJS(contractRes.data)
      ).tokens;
      tokens.push({
        [tokenClass.name]: {
          tokens: res,
          contractAddress: tokenClass.contractAddress,
        },
      });
    }
    return tokens;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getAccountTokenBalances = async (address: string) => {
  try {
    const tokens = await getAccountTokens(address);
    const classes: any[] = [];
    for (const token of tokens!) {
      const name = Object.keys(token)[0];
      const contractAddress = token[name].contractAddress;
      const balances: any[] = [];
      for (const id of token[name].tokens) {
        const msg = {
          balance: {
            owner: address,
            token_id: id,
          },
        };
        const res = await queryClient.cosmwasm.wasm.v1.smartContractState({
          address: contractAddress,
          queryData: utils.conversions.JsonToArray(JSON.stringify(msg)),
        });
        const balance = {
          [id]: JSON.parse(utils.conversions.Uint8ArrayToJS(res.data)).balance,
        };
        balances.push(balance);
      }
      const tClass = {
        [name]: balances,
      };
      classes.push(tClass);
    }
    return classes.map((c) => {
      const name = Object.keys(c)[0];
      const tokenData: any[] = [];
      for (const d of c[name]) {
        const id = Object.keys(d)[0];
        const balance = d[id];
        tokenData.push({ id, balance });
      }
      return { name, tokenData };
    });
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getMintAuthGrants = async (grantee: string) => {
  try {
    const grants = await queryClient.cosmos.authz.v1beta1.granteeGrants({
      grantee: grantee,
    });
    return grants.grants
      .filter(
        (grant) =>
          grant.authorization!.typeUrl ===
          "/ixo.token.v1beta1.MintAuthorization"
      )
      .map((grant) => ({
        granter: grant.granter,
        grantee: grant.grantee,
        authorization: registry.decode(grant.authorization!),
        exipration: grant.expiration,
      }))
      .flatMap((grant) =>
        grant.authorization.constraints.map((constraint) => ({
          amount: constraint.amount,
          name: constraint.name,
          index: constraint.index,
          nftCollection: constraint.collection,
          nftEntity: constraint.tokenData[0].id,
        }))
      );
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getFullMintAuthGrants = async (grantee: string) => {
  try {
    const grants = await queryClient.cosmos.authz.v1beta1.granteeGrants({
      grantee: grantee,
    });
    return grants.grants
      .filter(
        (grant) =>
          grant.authorization!.typeUrl ===
          "/ixo.token.v1beta1.MintAuthorization"
      )
      .map((grant) => ({
        granter: grant.granter,
        grantee: grant.grantee,
        authorization: registry.decode(grant.authorization!),
        expiration: utils.proto.fromTimestamp(grant.expiration!),
      }));
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getEntityTokens = async (did: string) => {
  try {
    const tokens = await getTokensByEntityId(did);
    const owner = await getEntityOwner(did);
    const accountBalances = await getAccountTokenBalances(owner);
    const balances = accountBalances!.flatMap((b) =>
      b.tokenData
        .map((t) => ({ ...t, name: b.name }))
        .filter((t) => tokens.map((t) => t.id).includes(t.id))
    );
    return balances;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getEntityOwner = async (did: string) => {
  try {
    const entityParams = await queryClient.ixo.entity.v1beta1.params();
    const contractAddress = entityParams.params!.nftContractAddress;
    const msg = {
      all_nft_info: {
        token_id: did,
      },
    };
    const res = await queryClient.cosmwasm.wasm.v1.smartContractState({
      address: contractAddress,
      queryData: utils.conversions.JsonToArray(JSON.stringify(msg)),
    });
    return JSON.parse(utils.conversions.Uint8ArrayToJS(res.data)).access.owner;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getIid = async (did: string) => {
  try {
    const iid = await queryClient.ixo.iid.v1beta1.iidDocument({ id: did });
    return iid.iidDocument;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const decodeMessage = (tx: any) => {
  try {
    return registry.decode(tx);
  } catch (error) {
    console.error(error);
    return;
  }
};

export const decodeEvent = (event: Event) => {
  const attributes = event.attributes.map((attr) => ({
    key: utils.conversions.Uint8ArrayToJS(attr.key),
    value: utils.conversions.Uint8ArrayToJS(attr.value),
  }));

  return {
    type: event.type,
    attributes: attributes,
  };
};

export const decodeTransaction = (tx: TxResponse) => {
  try {
    const res = registry.decode(tx.tx!);
    return res;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getTransaction = async (hash: string) => {
  try {
    return queryClient.cosmos.tx.v1beta1.getTx({ hash: hash });
  } catch (error) {
    console.error(error);
    return;
  }
};
