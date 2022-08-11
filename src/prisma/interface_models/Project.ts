export interface NewProject {
    data: NewData;
    projectDid: string;
    pubKey: string;
    senderDid: string;
    txHash: string;
    status: string;
}

interface NewData {
    title: string;
    type?: string;
    projectDid: string;
    ownerName: string;
    ownerEmail: string;
    shortDescription: string;
    longDescription: string;
    impactAction: string;
    createdOn: Date;
    createdBy: string;
    projectLocation: string;
    requiredClaims: string,
    sdgs: string[];
    templates: NewTemplates;
    claimStats: NewClaimStats;
    claims: NewClaim[];
    agentsStats: NewAgentStats;
    agents: NewAgent[];
    ixo: NewIxo;
    serviceEndpoint: string;
    imageLink: string;
    founder: NewFounder;
    nodeDid: string
}

interface NewIxo {
    totalStaked: number;
    totalUsed: number;
}

interface NewFounder {
    name: string;
    email: string;
    countryOfOrigin: string;
    shortDescription: string;
    websiteURL: string;
    logoLink: string;
}

interface NewClaimStats {
    currentSuccessful: number;
    currentRejected: number;
}

export interface NewClaim {
    date: Date;
    location: NewLocation;
    claimId: string;
    claimTemplateId: string;
    status: string;
    saDid: string;
    eaDid?: string;
}

interface NewLocation {
    long: string,
    lat: string
}

interface NewTemplates {
    claim: NewClaimTemplate;
}

interface NewClaimTemplate {
    schema: string,
    form: string
}

interface NewAgentStats {
    evaluators: number;
    evaluatorsPending: number;
    serviceProviders: number;
    serviceProvidersPending: number;
    investors: number;
    investorsPending: number;
}

export interface NewAgent {
    did: string;
    status: string;
    kyc?: boolean;
    role: string;
}

export interface IProject {
    projectDid: string;
    title: string;
    type?: string;
    ownerName: string;
    ownerEmail: string;
    shortDescription: string;
    longDescription: string;
    impactAction: string;
    createdOn: Date;
    createdBy: string;
    projectLocation: string;
    requiredClaims: string;
    sdgs: string[];
    templateSchema: string;
    templateForm: string;
    successfulClaims: number;
    rejectedClaims: number;
    evaluators: number;
    evaluatorsPending: number;
    serviceProviders: number;
    serviceProvidersPending: number;
    investors: number;
    investorsPending: number;
    ixoStaked: number;
    ixoUsed: number;
    serviceEndpoint: string;
    imageLink: string;
    founderName: string;
    founderEmail: string;
    founderCountry: string;
    founderDescription: string;
    founderWebsite: string;
    founderLogo: string;
    nodeDid: string;
    pubKey: string;
    senderDid: string;
    txHash: string;
    status: string;
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
    claimTemplateId: string;
    status: string;
    saId: string;
    eaId?: string;
};

export const convertAgentDoc = (projectDid: string, newAgent: NewAgent) => {
    let agentDoc: IAgent = {
        agentDid: newAgent.did,
        projectDid: projectDid,
        status: newAgent.status,
        kyc: newAgent.kyc,
        role: newAgent.role,
    };
    return agentDoc;
};

export const convertClaimDoc = (projectDid: string, newClaim: NewClaim) => {
    let claimDoc: IClaim = {
        claimId: newClaim.claimId,
        projectDid: projectDid,
        date: newClaim.date,
        location: [newClaim.location.long, newClaim.location.lat],
        claimTemplateId: newClaim.claimTemplateId,
        status: newClaim.status,
        saId: newClaim.saDid,
        eaId: newClaim.eaDid,
    };
    return claimDoc;
};

export const convertProjectDoc = (newProject: NewProject) => {
    let projectDoc: IProject = {
        projectDid: newProject.projectDid,
        title: newProject.data.title,
        type: newProject.data.type,
        ownerName: newProject.data.ownerName,
        ownerEmail: newProject.data.ownerEmail,
        shortDescription: newProject.data.shortDescription,
        longDescription: newProject.data.longDescription,
        impactAction: newProject.data.impactAction,
        createdOn: newProject.data.createdOn,
        createdBy: newProject.data.createdBy,
        projectLocation: newProject.data.projectLocation,
        requiredClaims: newProject.data.requiredClaims,
        sdgs: newProject.data.sdgs,
        templateSchema: newProject.data.templates.claim.schema,
        templateForm: newProject.data.templates.claim.form,
        successfulClaims: newProject.data.claimStats.currentSuccessful,
        rejectedClaims: newProject.data.claimStats.currentRejected,
        evaluators: newProject.data.agentsStats.evaluators,
        evaluatorsPending: newProject.data.agentsStats.evaluatorsPending,
        serviceProviders: newProject.data.agentsStats.serviceProviders,
        serviceProvidersPending: newProject.data.agentsStats.serviceProvidersPending,
        investors: newProject.data.agentsStats.investors,
        investorsPending: newProject.data.agentsStats.investorsPending,
        ixoStaked: newProject.data.ixo.totalStaked,
        ixoUsed: newProject.data.ixo.totalUsed,
        serviceEndpoint: newProject.data.serviceEndpoint,
        imageLink: newProject.data.imageLink,
        founderName: newProject.data.founder.name,
        founderEmail: newProject.data.founder.email,
        founderCountry: newProject.data.founder.countryOfOrigin,
        founderDescription: newProject.data.founder.shortDescription,
        founderWebsite: newProject.data.founder.websiteURL,
        founderLogo: newProject.data.founder.logoLink,
        nodeDid: newProject.data.nodeDid,
        pubKey: newProject.pubKey,
        senderDid: newProject.senderDid,
        txHash: newProject.txHash,
        status: newProject.status,
    };

    let agentDocs: IAgent[] = [];
    newProject.data.agents.forEach(agent => {
        agentDocs.push(convertAgentDoc(projectDoc.projectDid, agent));
    });

    let claimDocs: IClaim[] = [];
    newProject.data.claims.forEach(claim => {
        claimDocs.push(convertClaimDoc(projectDoc.projectDid, claim));
    });

    return { projectDoc, agentDocs, claimDocs };
};