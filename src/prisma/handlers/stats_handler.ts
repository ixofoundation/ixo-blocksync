import { prisma, statId } from "../prisma_client";
import { IStat } from "../interface_models/Stat";

export const createStats = async () => {
    let emptyStats: IStat = {
        totalServiceProviders: 0,
        totalProjects: 0,
        totalEvaluationAgents: 0,
        totalInvestors: 0,
        totalClaims: 0,
        successfulClaims: 0,
        submittedClaims: 0,
        pendingClaims: 0,
        rejectedClaims: 0,
        claimLocations: [""],
    };
    return prisma.stat.create({ data: emptyStats });
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