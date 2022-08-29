import { Prisma } from "@prisma/client";

export interface IProject {
    projectDid: string;
    data: Prisma.JsonObject;
    txHash: string;
    senderDid: string;
    pubKey: string;
    status?: string;
    entityType?: string;
    ixoStaked: Prisma.Decimal;
    ixoUsed: Prisma.Decimal;
    createdOn: Date;
    createdBy: string;
    nodeDid: string;
    successfulClaims: number,
    rejectedClaims: number,
    evaluators: number,
    evaluatorsPending: number,
    serviceProviders: number,
    serviceProvidersPending: number,
    investors: number,
    investorsPending: number,
};

export interface IAgent {
    agentDid: string;
    projectDid: string;
    status: string;
    kyc?: boolean;
    role: string;
};

export interface IClaim {
    claimId: string;
    projectDid: string;
    date: Date;
    location: string[];
    status: string;
    saId: string;
    eaId?: string;
};

export const convertProject = (project: any) => {
    let claimDocs: IClaim[] = [];
    let agentDocs: IAgent[] = [];

    if (project["data"]["claims"] !== []) {
        project["data"]["claims"].forEach(claim => {
            const claimDoc: IClaim = {
                claimId: claim["claimId"],
                projectDid: project["projectDid"],
                date: new Date(parseInt(claim["date"]["$date"]["$numberLong"])),
                status: claim["status"],
                location: [claim["location"]["long"], claim["location"]["lat"]],
                saId: claim["saDid"],
                eaId: claim["eaDid"] ? claim["eaDid"] : null,
            };
            claimDocs.push(claimDoc);
        });
    };
    delete project["data"]["claims"];

    if (project["data"]["agents"] !== []) {
        project["data"]["agents"].forEach(agent => {
            const agentDoc: IAgent = {
                agentDid: agent["did"],
                projectDid: project["projectDid"],
                status: agent["status"],
                kyc: agent["kyc"] ? agent["kyc"] : null,
                role: agent["role"],
            };
            agentDocs.push(agentDoc);
        });
    };
    delete project["data"]["agents"];

    let ixoStaked = new Prisma.Decimal(project["data"]["ixo"]["totalStaked"]);
    let ixoUsed = new Prisma.Decimal(project["data"]["ixo"]["totalUsed"]);
    let createdOn = new Date(parseInt(project["data"]["createdOn"]["$date"]["$numberLong"]));
    let createdBy = project["data"]["createdBy"];
    let nodeDid = project["data"]["nodeDid"];
    delete project["data"]["ixo"];
    delete project["data"]["createdOn"];
    delete project["data"]["createdBy"];
    delete project["data"]["nodeDid"];

    let successfulClaims = project["data"]["claimStats"]["currentSuccessful"];
    let rejectedClaims = project["data"]["claimStats"]["currentRejected"];
    let evaluators = project["data"]["agentStats"]["evaluators"];
    let evaluatorsPending = project["data"]["agentStats"]["evaluatorsPending"];
    let serviceProviders = project["data"]["agentStats"]["serviceProviders"];
    let serviceProvidersPending = project["data"]["agentStats"]["serviceProvidersPending"];
    let investors = project["data"]["agentStats"]["investors"];
    let investorsPending = project["data"]["agentStats"]["investorsPending"];
    delete project["data"]["agentStats"];
    delete project["data"]["claimStats"];

    let projectDoc: IProject = {
        projectDid: project["projectDid"],
        data: project["data"],
        txHash: project["txHash"],
        senderDid: project["senderDid"],
        pubKey: project["pubKey"],
        status: project["status"] ? project["status"] : null,
        entityType: project["entityType"] ? project["entityType"] : null,
        ixoStaked: ixoStaked,
        ixoUsed: ixoUsed,
        createdOn: createdOn,
        createdBy: createdBy,
        nodeDid: nodeDid,
        successfulClaims: successfulClaims,
        rejectedClaims: rejectedClaims,
        evaluators: evaluators,
        evaluatorsPending: evaluatorsPending,
        serviceProviders: serviceProviders,
        serviceProvidersPending: serviceProvidersPending,
        investors: investors,
        investorsPending: investorsPending,
    };

    return { projectDoc, agentDocs, claimDocs };
};