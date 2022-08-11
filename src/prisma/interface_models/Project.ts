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
    type: string;
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
    eaId: string;
};