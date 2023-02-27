import { prisma } from "../prisma/prisma_client";

const prefixes = ["did:x:", "did:ixo:", "did:sov:"];

export const getIidByIid = async (id: string) => {
    return prisma.iID.findFirst({
        where: {
            OR: [
                { id: prefixes[0] + id },
                { id: prefixes[1] + id },
                { id: prefixes[2] + id },
            ],
        },
    });
};

export const getDidByDid = async (did: string) => {
    const iid = await prisma.iID.findFirst({ where: { id: did } });
    return { did: iid?.id, publicKey: iid?.publicKey };
};
