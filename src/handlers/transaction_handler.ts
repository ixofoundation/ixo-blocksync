import { prisma } from "../prisma/prisma_client";

export const listTransactionsByType = async (
    type: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.transaction.findMany({
            where: { type: type },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.transaction.findMany({
            where: { type: type },
        });
    }
};
