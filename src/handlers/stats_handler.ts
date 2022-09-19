import { prisma } from "../prisma/prisma_client";
import { io, statId } from "../server";
import { AgentTypes } from "../types/Agent";
import { ClaimStatusTypes } from "../types/Claim";
import { MsgTypes } from "../types/Msg";

export const createStats = async () => {
    return prisma.stats.create({
        data: {
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
        },
    });
};

export const updateStats = async (statDoc: any) => {
    try {
        const res = await prisma.stats.update({
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
    }
};

export const getStats = async () => {
    return prisma.stats.findFirst();
};

export const updateAllStats = async (
    txnType: string,
    agentType?: string,
    claimStatus?: string,
    claimsRequired?: string,
) => {
    let statDoc = await getStats();
    let currentStats = {
        totalServiceProviders: statDoc?.totalServiceProviders || 0,
        totalProjects: statDoc?.totalProjects || 0,
        totalEvaluationAgents: statDoc?.totalEvaluationAgents || 0,
        totalInvestors: statDoc?.totalInvestors || 0,
        totalClaims: statDoc?.totalClaims || 0,
        successfulClaims: statDoc?.successfulClaims || 0,
        submittedClaims: statDoc?.submittedClaims || 0,
        pendingClaims: statDoc?.pendingClaims || 0,
        rejectedClaims: statDoc?.rejectedClaims || 0,
        claimLocations: statDoc?.claimLocations || 0,
    };

    if (claimsRequired) {
        currentStats.totalClaims =
            currentStats.totalClaims + Number(claimsRequired);
    }

    switch (txnType) {
        case MsgTypes.createProject:
            currentStats.totalProjects++;
            break;
        case MsgTypes.updateAgent:
            if (agentType === AgentTypes.evaluator) {
                currentStats.totalEvaluationAgents++;
            } else if (agentType === AgentTypes.service) {
                currentStats.totalServiceProviders++;
            } else if (agentType === AgentTypes.investor) {
                currentStats.totalInvestors++;
            }
            break;
        case MsgTypes.createClaim:
            currentStats.submittedClaims++;
            currentStats.pendingClaims++;
            break;
        case MsgTypes.evaluateClaim:
            if (claimStatus === ClaimStatusTypes.success) {
                currentStats.pendingClaims--;
                currentStats.successfulClaims++;
            } else if (claimStatus === ClaimStatusTypes.rejected) {
                currentStats.pendingClaims--;
                currentStats.rejectedClaims++;
            }
            break;
    }
    await updateStats(currentStats);
};
