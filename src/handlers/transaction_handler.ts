import { prisma } from "../prisma/prisma_client";

export const listTransactionsByType = async (type: string) => {
    return prisma.transaction.findMany({
        where: { type: type },
    });
};

export const listTransactionsByAddress = async (address: string) => {
    return prisma.transaction.findMany({
        where: { from: address },
    });
};

export const listTransactionsByAddressAndType = async (
    address: string,
    type: string,
) => {
    return prisma.transaction.findMany({
        where: { from: address, type: type },
    });
};
