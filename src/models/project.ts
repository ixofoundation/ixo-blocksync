export interface IProject {
    ownerName: string;
    ownerEmail: string;
    projectDid: string;
    shortDescription: string;
    longDescription: string;
    impactAction: string;
    createdOn: Date;
    createdBy: string;
    projectLocation: string;
    estimatedProjectDuration: number,
    sdgs: number[];
    claimsRequired: number;
    claimTemplate: string;
    socialMedia: ISocialMedia;
    serviceEndpoint: string;
    imageLink: string;
    founder: IFounder;
}

interface ISocialMedia {
    facebookLink: string;
    instagramLink: string;
    twitterLink: string;
    webLink: string;
}

interface IFounder {
    name: string,
    email: string,
    countryOfOrigin: string,
    shortDescription: string,
    websiteURL: string,
    logoLink: string
}

/* interface IAllProjects {
    totalServiceProviders: number,
    totalProjects: number,
    totalEvaluationAgents: number,
    claims: IClaims
}

interface IClaims {
    total: number,
    totalSuccesul: number,
    totalSubmitted: number,
    totalPending: number,
    totalRejected: number,
    claimLocations: ILocation[]
}

interface ILocation {
    long: string,
    lat: string
} */