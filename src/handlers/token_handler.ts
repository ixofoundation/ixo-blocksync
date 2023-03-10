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

export const getTokensByName = async (name: string) => {
    const tokens = await prisma.token.findMany({ where: { name: name } });
    for (const token of tokens) {
        token.tokenData = parseJson(token.tokenData);
    }
    return tokens;
};

export const getTokenById = async (id: string) => {
    const token = await prisma.token.findFirst({
        where: {
            id: id,
        },
    });
    token!.tokenData = parseJson(token!.tokenData);
    return token;
};
