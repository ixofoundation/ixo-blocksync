import { prisma } from "../prisma_client";
import { ICredential, IDid } from "../interface_models/DID";

export const createDid = async (didDoc: IDid) => {
    return prisma.dID.create({ data: didDoc });
};

export const addCredential = async (credentialDoc: ICredential) => {
    return prisma.credential.create({ data: credentialDoc });
};

export const getDidByDid = async (did: string) => {
    return prisma.dID.findFirst({
        where: { did: did },
    });
};