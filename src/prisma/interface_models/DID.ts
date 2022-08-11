export interface IDid {
    did: string;
    publicKey: string;
    Credential?: ICredential[];
};

export interface ICredential {
    did: string;
    claimId: string;
    claimKyc: boolean;
    issuer: string;
};