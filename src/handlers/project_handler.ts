import { prisma } from "../prisma/prisma_client";
import axios from "axios";
import axiosRetry from "axios-retry";
import { REST } from "../util/secrets";

axiosRetry(axios, { retries: 3 });

const prefixes = ["did:x:", "did:ixo:", "did:sov:"];

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
