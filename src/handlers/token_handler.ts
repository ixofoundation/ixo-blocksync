import { parseJson, prisma } from "../prisma/prisma_client";

export const getTokenClassByContractAddress = async (
    contractAddress: string,
) => {
    const tokenClass = await prisma.tokenClass.findFirst({
        where: { contractAddress: contractAddress },
    });
    tokenClass!.retired = parseJson(tokenClass!.retired);
    tokenClass!.cancelled = parseJson(tokenClass!.cancelled);
    return tokenClass;
};

export const getTokenClassByName = async (name: string) => {
    const tokenClass = await prisma.tokenClass.findFirst({
        where: { name: name },
    });
    tokenClass!.retired = parseJson(tokenClass!.retired);
    tokenClass!.cancelled = parseJson(tokenClass!.cancelled);
    return tokenClass;
};

export const getTokenClassesByClass = async (id: string) => {
    const tokenClasses = await prisma.tokenClass.findMany({
        where: {
            class: id,
        },
    });
    for (const tokenClass of tokenClasses) {
        tokenClass!.retired = parseJson(tokenClass!.retired);
        tokenClass!.cancelled = parseJson(tokenClass!.cancelled);
    }
    return tokenClasses;
};

export const getTokensByName = async (name: string) => {
    return prisma.token.findMany({
        where: { name: name },
        include: { tokenData: true },
    });
};

export const getTokenById = async (id: string) => {
    return prisma.token.findFirst({
        where: {
            id: id,
        },
        include: { tokenData: true },
    });
};

export const getTokensByEntityId = async (id: string) => {
    return prisma.token.findMany({
        where: {
            tokenData: {
                some: {
                    id: id,
                },
            },
        },
        include: {
            tokenData: true,
        },
    });
};

export const getTokensByCollection = async (id: string) => {
    return prisma.token.findMany({
        where: {
            collection: id,
        },
        include: {
            tokenData: true,
        },
    });
};
