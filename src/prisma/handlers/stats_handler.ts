import { prisma, statId } from "../prisma_client";
import { IStat } from "../interface_models/Stat";

export const createStats = async (statDoc: IStat) => {
    return prisma.stat.create({ data: statDoc });
}

export const updateStats = async (statDoc: IStat) => {
    return prisma.stat.update({
        where: {
            id: statId,
        },
        data: statDoc,
    });
};

export const getStats = async () => {
    return prisma.stat.findMany({
        where: {
            id: statId,
        },
    });
};