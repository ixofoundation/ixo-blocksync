import { prisma } from "../prisma_client";
import { IStat } from "../interface_models/Stat";

export const createStat = async (statDoc: IStat) => {
    return prisma.stat.create({ data: statDoc });
};

export const getStats = async () => {
    return prisma.stat.findMany();
};