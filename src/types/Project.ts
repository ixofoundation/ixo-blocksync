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
    successfulClaims: number;
    rejectedClaims: number;
    evaluators: number;
    evaluatorsPending: number;
    serviceProviders: number;
    serviceProvidersPending: number;
    investors: number;
    investorsPending: number;
}

export interface IAgent {
    agentDid: string;
    projectDid: string;
    status: string;
    kyc?: boolean;
    role: string;
}

export interface IClaim {
    claimId: string;
    projectDid: string;
    date: Date;
    location: string[];
    status: string;
    saId: string;
    eaId?: string;
}

export const convertProject = (project: any) => {
    let claimDocs: IClaim[] = [];
    let agentDocs: IAgent[] = [];

    if (["data"]["claims"] in project["data"]) {
        project["data"]["claims"].forEach((claim) => {
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
        delete project["data"]["claims"];
    }

    if (["data"]["agents"] in project["data"]) {
        project["data"]["agents"].forEach((agent) => {
            const agentDoc: IAgent = {
                agentDid: agent["did"],
                projectDid: project["projectDid"],
                status: agent["status"],
                kyc: agent["kyc"] ? agent["kyc"] : null,
                role: agent["role"],
            };
            agentDocs.push(agentDoc);
        });
        delete project["data"]["agents"];
    }

    let ixoStaked: Prisma.Decimal;
    if (["ixo"]["totalStaked"] in project["data"]) {
        ixoStaked = new Prisma.Decimal(project["data"]["ixo"]["totalStaked"]);
    } else {
        ixoStaked = new Prisma.Decimal(0);
    }
    let ixoUsed: Prisma.Decimal;
    if (["ixo"]["totalUsed"] in project["data"]) {
        ixoUsed = new Prisma.Decimal(project["data"]["ixo"]["totalUsed"]);
    } else {
        ixoUsed = new Prisma.Decimal(0);
    }
    let createdOn = new Date(parseInt(project["data"]["createdOn"]));
    let createdBy = project["data"]["createdBy"];
    let nodeDid = project["data"]["nodeDid"];
    let status = project["data"]["status"] ? project["data"]["status"] : null;
    delete project["data"]["status"];
    delete project["data"]["ixo"];
    delete project["data"]["createdOn"];
    delete project["data"]["createdBy"];
    delete project["data"]["nodeDid"];

    let successfulClaims: number;
    if (["claimStats"]["currentSuccessful"] in project["data"]) {
        successfulClaims = project["data"]["claimStats"]["currentSuccessful"];
    } else {
        successfulClaims = 0;
    }
    let rejectedClaims: number;
    if (["claimStats"]["currentRejected"] in project["data"]) {
        rejectedClaims = project["data"]["claimStats"]["currentRejected"];
    } else {
        rejectedClaims = 0;
    }
    let evaluators: number;
    if (["agentStats"]["evaluators"] in project["data"]) {
        evaluators = project["data"]["agentStats"]["evaluators"];
    } else {
        evaluators = 0;
    }
    let evaluatorsPending: number;
    if (["agentStats"]["evaluatorsPending"] in project["data"]) {
        evaluatorsPending = project["data"]["agentStats"]["evaluatorsPending"];
    } else {
        evaluatorsPending = 0;
    }
    let serviceProviders: number;
    if (["agentStats"]["serviceProviders"] in project["data"]) {
        serviceProviders = project["data"]["agentStats"]["serviceProviders"];
    } else {
        serviceProviders = 0;
    }
    let serviceProvidersPending: number;
    if (["agentStats"]["serviceProvidersPending"] in project["data"]) {
        serviceProvidersPending =
            project["data"]["agentStats"]["serviceProvidersPending"];
    } else {
        serviceProvidersPending = 0;
    }
    let investors: number;
    if (["agentStats"]["investors"] in project["data"]) {
        investors = project["data"]["agentStats"]["investors"];
    } else {
        investors = 0;
    }
    let investorsPending: number;
    if (["agentStats"]["investorsPending"] in project["data"]) {
        investorsPending = project["data"]["agentStats"]["investorsPending"];
    } else {
        investorsPending = 0;
    }
    delete project["data"]["agentStats"];
    delete project["data"]["claimStats"];

    let projectDoc: IProject = {
        projectDid: project["projectDid"],
        data: project["data"],
        txHash: project["txHash"],
        senderDid: project["senderDid"],
        pubKey: project["pubKey"],
        status: status,
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
