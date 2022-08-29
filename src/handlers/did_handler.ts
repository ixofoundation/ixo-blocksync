import { prisma } from "../prisma/prisma_client";
import { io } from "../server";
import { ICredential, IDid } from "../prisma/interface_models/DID";

export const createDid = async (didDoc: IDid, credentialDocs?: ICredential[]) => {
    try {
        let res: any;
        res = await prisma.dID.create({ data: didDoc });
        if (credentialDocs) {
            res += await prisma.credential.createMany({ data: credentialDocs });
        };
        io.emit("DID Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const addCredential = async (credentialDoc: ICredential) => {
    try {
        const res = await prisma.credential.create({ data: credentialDoc });
        io.emit("Credential Added", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const getDidByDid = async (did: string) => {
    return prisma.dID.findFirst({
        where: { did: did },
        include: { Credential: true },
    });
};