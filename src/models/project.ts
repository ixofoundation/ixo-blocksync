export interface IProject {
    title: string;
    projectDid: string;
    ownerName: string;
    shortDescription: string;
    longDescription: string;
    impactAction: string;
    createdOn: Date;
    createdBy: string;
    projectLocation: string;
    sdgs: number[];
    claims: IClaims;
    templates: ITemplates;
    agents: IAgents;
    evaluatorPayPerClaim: number;
    socialMedia: ISocialMedia;
    ixo: IIxo;
    serviceEndpoint: string;
    imageLink: string;
    founder: IFounder;
}

interface IIxo {
    totalStaked: number;
    totalUsed: number;
}

interface ISocialMedia {
    facebookLink: string;
    instagramLink: string;
    twitterLink: string;
    webLink: string;
}

interface IFounder {
    name: string;
    countryOfOrigin: string;
    shortDescription: string;
    websiteURL: string;
    logoLink: string;
}

interface IClaims {
    required: number;
    currentSucessful: number;
    currentRejected: number
}

interface ITemplates {
    claim: string;
}

interface IAgents {
    evaluators: number;
    EvaluatorsPending: number;
    ServiceProviders: number;
    ServiceProvidersPending: number;
    Investors: number;
}