import { Event } from "@cosmjs/tendermint-rpc/build/tendermint34/responses";
import { TxResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/base/abci/v1beta1/abci";
import { cosmos, utils } from "@ixo/impactxclient-sdk";
import Long from "long";
import { prisma } from "../prisma/prisma_client";
import { getTokensByEntityId } from "../handlers/token_handler";
import { queryClient, registry, tendermintClient } from "../sync/sync_chain";
import { getEntityOwner } from "../handlers/entity_handler";

export type Attribute = {
  key: string;
  value: string;
};

export type ConvertedEvent = {
  type: string;
  attributes: Attribute[];
};

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
      orderBy: cosmos.tx.v1beta1.OrderBy.ORDER_BY_ASC,
    });
    return res;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getTMBlockbyHeight = async (height: number) => {
  try {
    const res = await tendermintClient.blockResults(height);
    return res;
  } catch (error) {
    if (!error.toString().includes('"code":-32603'))
      console.error(error.toString());
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
