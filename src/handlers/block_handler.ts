import { GetBlockByHeightResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/base/tendermint/v1beta1/query";
import { GetTxsEventResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/tx/v1beta1/service";
import { utils } from "@ixo/impactxclient-sdk";
import { prisma } from "../prisma/prisma_client";

export const createBlock = async (
    blockHeight: number,
    timestamp: Date,
    blockHash: string,
    block: GetBlockByHeightResponse,
    txsEvent: GetTxsEventResponse,
) => {
    try {
        let total_gas = 0;
        for (const txRes of txsEvent.txResponses) {
            total_gas += txRes.gasUsed.low;
        }
        const proposer_address = Buffer.from(
            block.block?.header?.proposerAddress!,
        )
            .toString()
            .toUpperCase();
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
