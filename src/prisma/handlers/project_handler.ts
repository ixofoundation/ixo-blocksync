import { prisma } from "../prisma_client";
import axios from "axios";
import axiosRetry from "axios-retry";
import { IAgent, IClaim, IProject } from "../interface_models/Project";

axiosRetry(axios, { retries: 3 });

export const createProject = async (projectDoc: IProject) => {
    return prisma.project.create({ data: projectDoc });
};

export const addAgent = async (agentDoc: IAgent) => {
    return prisma.agent.create({ data: agentDoc });
};

export const getAgentCount = async (projectDid: string, status: string, role: string) => {
    return prisma.agent.count({
        where: {
            projectDid: projectDid,
            status: status,
            role: role,
        },
    });
};

export const updateAgentStatus = async (agentDid: string, status: string) => {
    return prisma.agent.update({
        where: { agentDid: agentDid },
        data: { status: status },
    });
};

export const updateAgentStats = async (projectDid: string, status: string, role: string) => {
    let stats;
    let count = await getAgentCount(projectDid, status, role);
    if (status === "0" && role === "SA") {
        stats = { serviceProvidersPending: count };
    } else if (status === "1" && role === "SA") {
        stats = { serviceProviders: count };
    } else if (status === "0" && role === "EA") {
        stats = { evaluatorsPending: count };
    } else if (status === "1" && role === "EA") {
        stats = { evaluators: count };
    } else if (status === "0" && role === "IA") {
        stats = { investorsPending: count };
    } else if (status === "1" && role === "IA") {
        stats = { investors: count };
    }
    return prisma.project.update({
        where: { projectDid: projectDid },
        data: stats,
    });
}

export const addClaim = async (claimDoc: IClaim) => {
    return prisma.claim.create({ data: claimDoc });
}

export const getClaimCount = async (projectDid: string, status: string) => {
    return prisma.claim.count({
        where: {
            projectDid: projectDid,
            status: status,
        },
    });
};

export const updateClaimStatus = async (claimId: string, status: string, agentDid: string) => {
    return prisma.claim.update({
        where: { claimId: claimId },
        data: {
            status: status,
            eaId: agentDid,
        },
    });
};

export const updateClaimStats = async (projectDid: string, status: string) => {
    let stats;
    let count = await getClaimCount(projectDid, status);
    if (status === "1") {
        stats = { successfulClaims: count };
    } else if (status === "2") {
        stats = { rejectedClaims: count };
    }
    return prisma.project.update({
        where: { projectDid: projectDid },
        data: stats,
    });
};

export const updateProjectStatus = async (projectDid: string, status: string) => {
    return prisma.project.update({
        where: { projectDid: projectDid },
        data: { status: status },
    });
};

export const updateProject = async (projectDid: string, projectDoc: any) => {
    return prisma.project.update({
        where: { projectDid: projectDid },
        data: projectDoc,
    });
};

export const listAllProjects = async () => {
    return prisma.project.findMany();
};

export const listAllProjectsFiltered = async (fields: string[]) => {
    let filter = {};
    for (const i in fields) {
        filter[fields[i]] = true;
    };
    return prisma.project.findMany({
        select: filter,
    });
};

export const listProjectByProjectDid = async (projectDid: string) => {
    return prisma.project.findFirst({
        where: { projectDid: projectDid },
    });
};
//"type" not in mongodb model
export const listProjectByEntityType = async (entityType: string) => {
    return prisma.project.findMany({
        where: { type: entityType },
    });
};

export const listProjectBySenderDid = async (senderDid: any) => {
    return prisma.project.findMany({
        where: { senderDid: senderDid },
    });
};

export const getProjectAccountsFromChain = async (projectDid: string) => {
    const rest = (process.env.BC_REST || "http://localhost:1317");
    return axios.get(rest + "/projectAccounts/" + projectDid);
};