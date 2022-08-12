import { prisma } from "../prisma_client";
import { IChain } from "../interface_models/Chain";

export const createChain = async (chainDoc: IChain) => {
    const existingChain = await prisma.chain.findFirst({
        where: { chainId: chainDoc.chainId },
    });
    if (existingChain) {
        return existingChain
    } else {
        return prisma.chain.create({ data: chainDoc });
    }
};

export const updateChain = async (chainDoc: IChain) => {
    return prisma.chain.update({
        where: { chainId: chainDoc.chainId },
        data: { blockHeight: chainDoc.blockHeight },
    });
};

export const getChain = async () => {
    return prisma.chain.findMany();
};