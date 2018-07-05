export interface IDid {
	did: string;
	publicKey: string;
	credentials?: ICredential[];
}
export interface ICredential {
	type: string;
	data: string;
	signer: string;
}
