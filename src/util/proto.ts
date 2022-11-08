import { ixo, cosmos } from "@ixo/impactxclient-sdk";
import { RPC } from "./secrets";
import Long from "long";

export const getBlock = async (height: number | string) => {
    try {
        const { createRPCQueryClient } = cosmos.ClientFactory;
        const client = await createRPCQueryClient({ rpcEndpoint: RPC });
        const res =
            await client.cosmos.base.tendermint.v1beta1.getBlockByHeight({
                height: Long.fromNumber(Number(height)),
            });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getLastBlock = async () => {
    try {
        const { createRPCQueryClient } = cosmos.ClientFactory;
        const client = await createRPCQueryClient({ rpcEndpoint: RPC });
        const res =
            await client.cosmos.base.tendermint.v1beta1.getLatestBlock();
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getBondsInfo = async (height: number) => {
    try {
        const { createRPCQueryClient } = ixo.ClientFactory;
        const client = await createRPCQueryClient({ rpcEndpoint: RPC });
        const res = await client.ixo.bonds.bondsDetailed({
            height: Long.fromNumber(Number(height)),
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};
