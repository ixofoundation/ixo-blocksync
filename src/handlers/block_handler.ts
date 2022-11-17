import { GetBlockByHeightResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/base/tendermint/v1beta1/query";
import { GetTxsEventResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/tx/v1beta1/service";
import { prisma } from "../prisma/prisma_client";
import { Uint8ArrayToJS } from "../util/proto";

export const createBlock = async (
    blockHeight: number,
    timestamp: Date,
    blockHash: string,
    block: GetBlockByHeightResponse,
    txsEvent: GetTxsEventResponse,
) => {
    try {
        let total_gas = 0;
        txsEvent.txResponses.forEach((txRes) => {
            total_gas += txRes.gasUsed.low;
        });
        const proposer_address = Uint8ArrayToJS(
            //@ts-ignore
            block.block?.header?.proposerAddress,
        );
        const blockDoc = {
            height: blockHeight,
            hash: blockHash,
            num_txs: txsEvent.txs.length,
            total_gas: total_gas,
            proposer_address: proposer_address,
            timestamp: timestamp,
        };
        const res = await prisma.block.create({ data: blockDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getLastSyncedBlock = async () => {
    return prisma.block.findFirst({
        orderBy: {
            height: "desc",
        },
        take: 1,
    });
};

export const isBlockSynced = async (blockHeight: number) => {
    const res = await prisma.block.findFirst({
        where: { height: blockHeight },
    });
    if (res !== null) {
        return true;
    } else {
        return false;
    }
};
