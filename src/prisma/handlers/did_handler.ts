import { prisma } from "../prisma_client";
import { ICredential, IDid } from "../interface_models/DID";

export const createDid = async (didDoc: IDid, credentialDocs?: ICredential[]) => {
    let result: any;
    result = prisma.dID.create({ data: didDoc });
    if (credentialDocs) { result += prisma.credential.createMany({ data: credentialDocs }) };
    return result;
};

export const addCredential = async (credentialDoc: ICredential) => {
    return prisma.credential.create({ data: credentialDoc });
};

export const getDidByDid = async (did: string) => {
    return prisma.dID.findFirst({
        where: { did: did },
        include: { Credential: true },
    });
};