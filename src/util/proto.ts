import {
    createQueryClient,
    createRegistry,
    utils,
} from "@ixo/impactxclient-sdk";
import Long from "long";
import { RPC } from "./secrets";

enum OrderBy {
    ORDER_BY_UNSPECIFIED = 0,
    ORDER_BY_ASC = 1,
    ORDER_BY_DESC = 2,
    UNRECOGNIZED = -1,
}

export interface Timestamp {
    seconds: Long;
    nanos: number;
}

interface EventAttribute {
    key: Uint8Array;
    value: Uint8Array;
    index: boolean;
}

export interface Event {
    type: string;
    attributes: EventAttribute[];
}

export interface ConvertedEvent {
    type: string;
    attributes: any[];
}

export const getBlockbyHeight = async (height: number | string) => {
    try {
        const client = await createQueryClient(RPC);
        const res =
            await client.cosmos.base.tendermint.v1beta1.getBlockByHeight({
                height: Long.fromNumber(Number(height)),
            });
        return res;
    } catch (error) {
        if (error.toString().includes("(18)")) {
            console.log("Waiting for Blocks");
            return;
        }
        console.log(error);
        return;
    }
};

export const getLatestBlock = async () => {
    try {
        const client = await createQueryClient(RPC);
        const res =
            await client.cosmos.base.tendermint.v1beta1.getLatestBlock();
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getTxsEvent = async (height: number) => {
    try {
        const client = await createQueryClient(RPC);
        const res = await client.cosmos.tx.v1beta1.getTxsEvent({
            events: [`tx.height=${String(height)}`],
            orderBy: OrderBy.ORDER_BY_ASC,
        });
        return res;
    } catch (error) {
        if (error.toString().includes("(18)")) {
            console.log("Waiting for Blocks");
            return;
        }
        console.log(error);
        return;
    }
};

export const getBondsInfo = async () => {
    try {
        const client = await createQueryClient(RPC);
        const res = await client.ixo.bonds.v1beta1.bondsDetailed();
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getAccountBonds = async (address: string) => {
    try {
        const client = await createQueryClient(RPC);
        const balances = await client.cosmos.bank.v1beta1.allBalances({
            address: address,
        });
        const denoms: string[] = [];
        for (const balance of balances.balances) {
            denoms.push(balance.denom);
        }
        const bonds = await client.ixo.bonds.v1beta1.bondsDetailed();
        const accountBonds = bonds.bondsDetailed.filter((bond) => {
            const supplyDenom = bond.supply?.denom || "";
            return denoms.includes(supplyDenom);
        });
        const res: any[] = [];
        for (let index = 0; index < accountBonds.length; index++) {
            const bond = (
                await client.ixo.bonds.v1beta1.bond({
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
        console.log(error);
        return;
    }
};

export const getAccountEntities = async (address: string) => {
    try {
        const client = await createQueryClient(RPC);
        const entityParams = await client.ixo.entity.v1beta1.params();
        const contractAddress = entityParams.params!.nftContractAddress;
        const msg = {
            tokens: {
                owner: address,
            },
        };
        const res = await client.cosmwasm.wasm.v1.smartContractState({
            address: contractAddress,
            queryData: utils.conversions.JsonToArray(JSON.stringify(msg)),
        });
        return JSON.parse(utils.conversions.Uint8ArrayToJS(res.data)).tokens;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getEntityOwner = async (did: string) => {
    try {
        const client = await createQueryClient(RPC);
        const entityParams = await client.ixo.entity.v1beta1.params();
        const contractAddress = entityParams.params!.nftContractAddress;
        const msg = {
            all_nft_info: {
                token_id: did,
            },
        };
        const res = await client.cosmwasm.wasm.v1.smartContractState({
            address: contractAddress,
            queryData: utils.conversions.JsonToArray(JSON.stringify(msg)),
        });
        return JSON.parse(utils.conversions.Uint8ArrayToJS(res.data)).access
            .owner;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getIid = async (did: string) => {
    try {
        const client = await createQueryClient(RPC);
        const iid = await client.ixo.iid.v1beta1.iidDocument({ id: did });
        return iid.iidDocument;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const decode = async (tx: any) => {
    try {
        const registry = createRegistry();
        //@ts-ignore
        return registry.decode(tx);
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getTimestamp = (time: Timestamp) => {
    try {
        return new Date(
            Number(time.seconds) * 1000 + Number(time.nanos) / 1000000,
        );
    } catch (error) {
        return null;
    }
};

export const getEvent = (event: Event) => {
    const attributes: any[] = [];
    for (const attr of event.attributes) {
        attributes.push({
            key: utils.conversions.Uint8ArrayToJS(attr.key),
            value: utils.conversions.Uint8ArrayToJS(attr.value),
            index: attr.index,
        });
    }
    return {
        type: event.type,
        attributes: attributes,
    };
};
