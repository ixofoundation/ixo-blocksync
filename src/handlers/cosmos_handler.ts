import { prisma } from "../prisma/prisma_client";

export const createCosmosBlock = async (
    blockHash: string,
    block: any,
    blockResult: any,
) => {
    try {
        let total_gas = 0;
        if (blockResult.txs_results) {
            blockResult.txs_results.forEach((tx: any) => {
                total_gas += parseInt(tx.gas_used);
            });
        }
        const blockDoc = {
            height: parseInt(block.header.height),
            hash: blockHash,
            num_txs: block.data.txs.length,
            total_gas: total_gas,
            proposer_address: block.header.proposer_address,
            timestamp: new Date(Date.parse(block.header.time)),
        };
        const res = await prisma.cosmosBlock.create({ data: blockDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};
