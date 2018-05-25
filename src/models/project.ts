export interface IProject {
    txHash: string;
    senderDid: string;
    projectDid: string;
    pubKey: string;
    title: string;
    shortDescription: string;
    longDescription: string;
    impactAction: string;
    createdOn: Date;
    createdBy: string;
    country: string;
    sdgs: string[];
    impactsRequired: number;
    claimTemplate: string;
    socialMedia: ISocialMedia;
    serviceEndpoint: string;
    imageLink: string;
}

interface ISocialMedia {
    facebookLink: string;
    instagramLink: string;
    twitterLink: string;
}

