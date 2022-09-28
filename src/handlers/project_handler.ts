import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";
import { io } from "../server";
import axios from "axios";
import axiosRetry from "axios-retry";
import { REST } from "../util/secrets";

axiosRetry(axios, { retries: 3 });

export const createProject = async (
    projectDoc: Prisma.ProjectCreateInput,
    agentDocs: Prisma.AgentUncheckedCreateInput[],
    claimDocs: Prisma.ClaimUncheckedCreateInput[],
) => {
    try {
        let res: any;
        res = await prisma.project.create({ data: projectDoc });
        if (agentDocs.length > 0) {
            res += await prisma.agent.createMany({ data: agentDocs });
        }
        if (claimDocs.length > 0) {
            res += await prisma.claim.createMany({ data: claimDocs });
        }
        io.emit("Project Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addAgent = async (agentDoc: Prisma.AgentUncheckedCreateInput) => {
    try {
        const res = await prisma.agent.create({ data: agentDoc });
        io.emit("Agent Added", { agent: agentDoc });
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

export const updateAgentStatus = async (agentDid: string, status: string) => {
    try {
        const res = await prisma.agent.update({
            where: { agentDid: agentDid },
            data: { status: status },
        });
        io.emit("Agent Updated", { agentDid: agentDid, status: status });
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
        io.emit("Agent Stats Updated", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addClaim = async (claimDoc: Prisma.ClaimUncheckedCreateInput) => {
    try {
        const res = await prisma.claim.create({ data: claimDoc });
        io.emit("Claim Added", { claim: claimDoc });
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
        io.emit("Claim Status Updated", { claimId: claimId, status: status });
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
        io.emit("Claim Stats Updated", {
            projectDid: projectDid,
            updatedStats: status,
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
        io.emit("Project Status Updated", {
            projectDid: projectDid,
            status: status,
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateProject = async (projectDid: string, projectDoc: any) => {
    try {
        if (projectDoc["data"]["claims"]) {
            delete projectDoc["data"]["claims"];
        }
        if (projectDoc["data"]["agents"]) {
            delete projectDoc["data"]["agents"];
        }
        if (projectDoc["data"]["ixo"]) {
            delete projectDoc["data"]["ixo"];
        }
        if (projectDoc["data"]["createdOn"]) {
            delete projectDoc["data"]["createdOn"];
        }
        if (projectDoc["data"]["createdBy"]) {
            delete projectDoc["data"]["createdBy"];
        }
        if (projectDoc["data"]["nodeDid"]) {
            delete projectDoc["data"]["nodeDid"];
        }
        if (projectDoc["data"]["agentStats"]) {
            delete projectDoc["data"]["agentStats"];
        }
        if (projectDoc["data"]["claimStats"]) {
            delete projectDoc["data"]["claimStats"];
        }
        const res = await prisma.project.update({
            where: { projectDid: projectDid },
            data: {
                data: projectDoc,
            },
        });
        io.emit("Project Updated", { projectDid: projectDid });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const listAllProjects = async (page: string, size: string) => {
    const res = await prisma.project.findMany({
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
    io.emit("List all Projects", res);
    return res;
};

export const listAllProjectsFiltered = async (
    fields: string[],
    page: string,
    size: string,
) => {
    let filter = {};
    for (const i in fields) {
        filter[fields[i]] = true;
    }
    const res = await prisma.project.findMany({
        select: filter,
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
    io.emit("List Specified Fields of all Projects", res);
    return res;
};

export const listProjectByProjectDid = async (projectDid: string) => {
    const res = await prisma.project.findFirst({
        where: { projectDid: projectDid },
    });
    io.emit("List Project by DID", res);
    return res;
};

export const listProjectByEntityType = async (
    entityType: string,
    page: string,
    size: string,
) => {
    const res = await prisma.project.findMany({
        where: { entityType: entityType },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
    io.emit("List Project by Entity Type", res);
    return res;
};

export const listProjectBySenderDid = async (
    senderDid: any,
    page: string,
    size: string,
) => {
    const res = await prisma.project.findMany({
        where: { senderDid: senderDid },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
    io.emit("List Project by Sender DID", res);
    return res;
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
