import { prisma } from "../prisma/prisma_client";

export const getStats = async () => {
    return prisma.stats.findFirst();
};
