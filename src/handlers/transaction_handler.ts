import { prisma } from "../prisma/prisma_client";

export const listTransactionsByType = async (
    type: string,
    page: string,
    size: string,
) => {
    return prisma.transaction.findMany({
        where: { type: type },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
};

export const listTransactionsByAddress = async (
    address: string,
    page: string,
    size: string,
) => {
    return prisma.transaction.findMany({
        where: { from: address },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
};

export const listTransactionsByAddressAndType = async (
    address: string,
    type: string,
    page: string,
    size: string,
) => {
    return prisma.transaction.findMany({
        where: { from: address, type: type },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
};
