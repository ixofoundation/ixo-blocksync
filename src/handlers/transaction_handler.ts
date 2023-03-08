import { prisma } from "../prisma/prisma_client";

export const getLatestTransactions = async (address: string) => {
    return prisma.message.findMany({
        where: {
            OR: [{ from: address }, { to: address }],
        },
        orderBy: {
            id: "desc",
        },
        take: 3,
        include: {
            Transaction: true,
        },
    });
};

export const listTransactionsByType = async (
    type: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.message.findMany({
            where: { typeUrl: type },
            include: {
                Transaction: true,
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.message.findMany({
            where: { typeUrl: type },
            include: {
                Transaction: true,
            },
        });
    }
};
