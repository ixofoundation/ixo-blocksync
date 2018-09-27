export interface IDid {
	did: string;
	publicKey: string;
	credentials?: ICredential[];
}
export interface ICredential {
	type: [string];
	claim: {};
	issuer: string;
}
