import { prisma } from "../prisma/prisma_client";
import { IChain } from "../prisma/interface_models/Chain";

export const createChain = async (chainDoc: IChain) => {
    const existingChain = await prisma.chain.findFirst({
        where: { chainId: chainDoc.chainId },
    });
    if (existingChain) {
        return existingChain;
    } else {
        return prisma.chain.create({ data: chainDoc });
    };
};

export const updateChain = async (chainDoc: IChain) => {
    try {
        const res = await prisma.chain.update({
            where: { chainId: chainDoc.chainId },
            data: { blockHeight: chainDoc.blockHeight },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const getChain = async () => {
    try {
        const res = await prisma.chain.findMany();
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};