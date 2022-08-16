import { prisma } from "../prisma/prisma_client";
import { io, statId } from "../server";
import { IStat } from "../prisma/interface_models/Stat";

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
};

export const updateStats = async (statDoc: IStat) => {
    try {
        const res = await prisma.stat.update({
            where: {
                id: statId,
            },
            data: statDoc,
        });
        io.emit("Stats Updated", statDoc);
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const getStats = async () => {
    return prisma.stat.findMany({
        where: {
            id: statId,
        },
    });
};