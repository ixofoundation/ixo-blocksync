import { prisma } from "../prisma/prisma_client";

export const getTokenClassByContractAddress = async (
    contractAddress: string,
) => {
    return prisma.tokenClass.findFirst({
        where: { contractAddress: contractAddress },
    });
};

export const getTokenClassByName = async (name: string) => {
    return prisma.tokenClass.findFirst({ where: { name: name } });
};

export const getTokensByName = async (name: string) => {
    return prisma.token.findMany({ where: { name: name } });
};

export const getTokenById = async (id: string) => {
    return prisma.token.findFirst({
        where: {
            id: id,
        },
    });
};
