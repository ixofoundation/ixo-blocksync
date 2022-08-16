import { prisma } from "../prisma/prisma_client";
import { io } from "../server";
import axios from "axios";
import axiosRetry from "axios-retry";
import { IAgent, IClaim, IProject } from "../prisma/interface_models/Project";

axiosRetry(axios, { retries: 3 });

export const createProject = async (projectDoc: IProject, agentDocs: IAgent[], claimDocs: IClaim[]) => {
    try {
        let result: any;
        result = await prisma.project.create({ data: projectDoc });
        result += await prisma.agent.createMany({ data: agentDocs });
        result += await prisma.claim.createMany({ data: claimDocs });
        io.emit("Project Created", result);
        return result;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const addAgent = async (agentDoc: IAgent) => {
    try {
        const res = await prisma.agent.create({ data: agentDoc });
        io.emit("Agent Added", { agent: agentDoc });
        return res;
    } catch (error) {
        console.log(error);
        return resizeBy;
    };
};

export const getAgentCount = async (projectDid: string, status: string, role: string) => {
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
    };
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
    };
};

export const updateAgentStats = async (projectDid: string, status: string, role: string) => {
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
    };
};

export const addClaim = async (claimDoc: IClaim) => {
    try {
        const res = await prisma.claim.create({ data: claimDoc });
        io.emit("Claim Added", { claim: claimDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
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
    };
};

export const updateClaimStatus = async (claimId: string, status: string, agentDid: string) => {
    try {
        const res = await prisma.claim.update({
            where: { claimId: claimId },
            data: {
                status: status,
                eaId: agentDid,
            },
        });
        io.emit("Claim Status Updated", { claimId: claimId, status: status });
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
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
        io.emit("Claim Stats Updated", { projectDid: projectDid, updatedStats: status });
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const updateProjectStatus = async (projectDid: string, status: string) => {
    try {
        const res = await prisma.project.update({
            where: { projectDid: projectDid },
            data: { status: status },
        });
        io.emit("Project Status Updated", { projectDid: projectDid, status: status });
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const updateProject = async (projectDid: string, projectDoc: any) => {
    try {
        const res = await prisma.project.update({
            where: { projectDid: projectDid },
            data: projectDoc,
        });
        io.emit("Project Updated", { projectDid: projectDid });
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const listAllProjects = async () => {
    const res = await prisma.project.findMany();
    io.emit("List all Projects", res);
    return res;
};

export const listAllProjectsFiltered = async (fields: string[]) => {
    let filter = {};
    for (const i in fields) {
        filter[fields[i]] = true;
    };
    const res = await prisma.project.findMany({
        select: filter,
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

export const listProjectByEntityType = async (entityType: string) => {
    const res = await prisma.project.findMany({
        where: { type: entityType },
    });
    io.emit("List Project by Entity Type", res);
    return res;
};

export const listProjectBySenderDid = async (senderDid: any) => {
    const res = await prisma.project.findMany({
        where: { senderDid: senderDid },
    });
    io.emit("List Project by Sender DID", res);
    return res;
};

export const getProjectAccountsFromChain = async (projectDid: string) => {
    const rest = (process.env.BC_REST || "http://localhost:1317");
    const response = await axios.get(rest + "/projectAccounts/" + projectDid);
    if (response.status == 200) {
        return response;
    } else {
        console.log(response.statusText);
        return;
    }
};