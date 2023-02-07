import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";
import axios from "axios";
import axiosRetry from "axios-retry";
import { REST } from "../util/secrets";

axiosRetry(axios, { retries: 3 });

const prefixes = ["did:x:", "did:ixo:", "did:sov:"];

export const createProject = async (projectDoc: Prisma.ProjectCreateInput) => {
    try {
        return prisma.project.create({ data: projectDoc });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addAgent = async (agentDoc: Prisma.AgentUncheckedCreateInput) => {
    try {
        const res = await prisma.agent.create({ data: agentDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getAgentCount = async (
    projectDid: string,
    status: string,
    role: string,
) => {
    try {
        const res = await prisma.agent.count({
            where: {
                projectDid: projectDid,
                status: status,
                role: role,
            },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateAgentStatus = async (
    agentDid: string,
    projectDid: string,
    status: string,
) => {
    try {
        const res = await prisma.agent.updateMany({
            where: { agentDid: agentDid, projectDid: projectDid },
            data: { status: status },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateAgentStats = async (
    projectDid: string,
    status: string,
    role: string,
) => {
    try {
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
        const res = await prisma.project.update({
            where: { projectDid: projectDid },
            data: stats,
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addClaim = async (claimDoc: Prisma.ClaimUncheckedCreateInput) => {
    try {
        const res = await prisma.claim.create({ data: claimDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getClaimCount = async (projectDid: string, status: string) => {
    try {
        const res = await prisma.claim.count({
            where: {
                projectDid: projectDid,
                status: status,
            },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateClaimStatus = async (claimId: string, status: string) => {
    try {
        const res = await prisma.claim.update({
            where: { claimId: claimId },
            data: { status: status },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateClaimStats = async (projectDid: string, status: string) => {
    try {
        let stats;
        let count = await getClaimCount(projectDid, status);
        if (status === "1") {
            stats = { successfulClaims: count };
        } else if (status === "2") {
            stats = { rejectedClaims: count };
        }
        const res = await prisma.project.update({
            where: { projectDid: projectDid },
            data: stats,
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateProjectStatus = async (
    projectDid: string,
    status: string,
) => {
    try {
        const res = await prisma.project.update({
            where: { projectDid: projectDid },
            data: { status: status },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateProject = async (projectDid: string, projectDoc: string) => {
    try {
        return prisma.project.update({
            where: { projectDid: projectDid },
            data: {
                data: projectDoc,
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const listAllProjects = async (page?: string, size?: string) => {
    if (page && size) {
        return prisma.project.findMany({
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.project.findMany();
    }
};

export const listAllProjectsFiltered = async (
    fields: string[],
    page?: string,
    size?: string,
) => {
    let filter = {};
    for (const i in fields) {
        filter[fields[i]] = true;
    }
    if (page && size) {
        return prisma.project.findMany({
            select: filter,
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.project.findMany({ select: filter });
    }
};

export const listProjectByProjectDid = async (projectDid: string) => {
    return prisma.project.findFirst({
        where: {
            OR: [
                { projectDid: prefixes[0] + projectDid },
                { projectDid: prefixes[1] + projectDid },
                { projectDid: prefixes[2] + projectDid },
            ],
        },
    });
};

export const listProjectByEntityType = async (
    entityType: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.project.findMany({
            where: { entityType: entityType },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.project.findMany({
            where: { entityType: entityType },
        });
    }
};

export const listProjectBySenderDid = async (
    senderDid: any,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.project.findMany({
            where: {
                OR: [
                    { senderDid: prefixes[0] + senderDid },
                    { senderDid: prefixes[1] + senderDid },
                    { senderDid: prefixes[2] + senderDid },
                ],
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.project.findMany({
            where: {
                OR: [
                    { senderDid: prefixes[0] + senderDid },
                    { senderDid: prefixes[1] + senderDid },
                    { senderDid: prefixes[2] + senderDid },
                ],
            },
        });
    }
};

export const getProjectsByCreatedAndAgent = async (
    did: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.project.findMany({
            where: {
                status: "STARTED",
                OR: [
                    {
                        createdBy: prefixes[0] + did,
                    },
                    {
                        Agent: {
                            some: { agentDid: prefixes[0] + did },
                        },
                    },
                    {
                        createdBy: prefixes[1] + did,
                    },
                    {
                        Agent: {
                            some: { agentDid: prefixes[1] + did },
                        },
                    },
                    {
                        createdBy: prefixes[2] + did,
                    },
                    {
                        Agent: {
                            some: { agentDid: prefixes[2] + did },
                        },
                    },
                ],
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.project.findMany({
            where: {
                status: "STARTED",
                OR: [
                    {
                        createdBy: prefixes[0] + did,
                    },
                    {
                        Agent: {
                            some: { agentDid: prefixes[0] + did },
                        },
                    },
                    {
                        createdBy: prefixes[1] + did,
                    },
                    {
                        Agent: {
                            some: { agentDid: prefixes[1] + did },
                        },
                    },
                    {
                        createdBy: prefixes[2] + did,
                    },
                    {
                        Agent: {
                            some: { agentDid: prefixes[2] + did },
                        },
                    },
                ],
            },
        });
    }
};

export const getProjectAccountsFromChain = async (projectDid: string) => {
    const res = await axios.get(REST + "/projectAccounts/" + projectDid);
    if (res.status == 200) {
        return res;
    } else {
        console.log(res.statusText);
        return;
    }
};
