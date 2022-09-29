import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";

export const createDid = async (didDoc: Prisma.DIDCreateInput) => {
    try {
        const res = await prisma.dID.create({ data: didDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addCredential = async (
    credentialDoc: Prisma.CredentialUncheckedCreateInput,
) => {
    try {
        const res = await prisma.credential.create({ data: credentialDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getDidByDid = async (did: string) => {
    return prisma.dID.findFirst({
        where: { did: did },
        include: { Credential: true },
    });
};
