import {
    createQueryClient,
    createRegistry,
    utils,
} from "@ixo/impactxclient-sdk";
import {
    rawEd25519PubkeyToRawAddress,
    rawSecp256k1PubkeyToRawAddress,
} from "@cosmjs/amino";
import { Bech32 } from "@cosmjs/encoding";
import base58 from "bs58";
import Long from "long";
import { RPC } from "./secrets";
import { prisma } from "../prisma/prisma_client";

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

export const getAccountTokens = async (address: string) => {
    try {
        const client = await createQueryClient(RPC);
        const tokenClasses = await prisma.tokenClass.findMany();
        const tokens: any[] = [];
        for (const tokenClass of tokenClasses) {
            const msg = {
                tokens: {
                    owner: address,
                },
            };
            const contractRes =
                await client.cosmwasm.wasm.v1.smartContractState({
                    address: tokenClass.contractAddress,
                    queryData: utils.conversions.JsonToArray(
                        JSON.stringify(msg),
                    ),
                });
            const res = JSON.parse(
                utils.conversions.Uint8ArrayToJS(contractRes.data),
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
        console.log(error);
        return;
    }
};

export const getAccountTokenBalances = async (address: string) => {
    try {
        const client = await createQueryClient(RPC);
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
                const res = await client.cosmwasm.wasm.v1.smartContractState({
                    address: contractAddress,
                    queryData: utils.conversions.JsonToArray(
                        JSON.stringify(msg),
                    ),
                });
                const balance = {
                    [id]: JSON.parse(utils.conversions.Uint8ArrayToJS(res.data))
                        .balance,
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
        console.log(error);
        return;
    }
};

export const getMintAuthGrants = async (grantee: string) => {
    try {
        const client = await createQueryClient(RPC);
        const registry = createRegistry();
        const grants = await client.cosmos.authz.v1beta1.granteeGrants({
            grantee: grantee,
        });
        const decodedGrants = grants.grants.map((grant) => ({
            granter: grant.granter,
            grantee: grant.grantee,
            authorization: registry.decode(grant.authorization!),
            expiration: grant.expiration,
        }));
        return decodedGrants.filter(
            (grant) =>
                grant.authorization.typeUrl ===
                "/ixo.token.v1beta1.MsgMintToken",
        );
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

export const getTransaction = async (hash: string) => {
    try {
        const client = await createQueryClient(RPC);
        return client.cosmos.tx.v1beta1.getTx({ hash: hash });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getAddressFromDid = async (did: string, ed = false) => {
    try {
        const client = await createQueryClient(RPC);
        const iid = await client.ixo.iid.v1beta1.iidDocument({ id: did });
        let publicKeyBase = ed
            ? iid.iidDocument!.verificationMethod[0].publicKeyBase58!
            : iid.iidDocument!.verificationMethod[0].publicKeyMultibase!;
        for (const method of iid.iidDocument!.verificationMethod) {
            if (method.publicKeyBase58) publicKeyBase = method.publicKeyBase58;
        }
        const key = ed
            ? rawEd25519PubkeyToRawAddress(base58.decode(publicKeyBase))
            : rawSecp256k1PubkeyToRawAddress(base58.decode(publicKeyBase));
        const address = Bech32.encode("ixo", key);
        return address;
    } catch (error) {
        console.log(error);
        return;
    }
};
