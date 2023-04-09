import { parseJson, prisma } from "../prisma/prisma_client";

export const getTokenClassByContractAddress = async (
  contractAddress: string
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

export const getTokenRetiredAmount = async (name: string, id: string) => {
  const tokenClass = await prisma.tokenClass.findFirst({
    where: {
      name: name,
    },
  });
  if (tokenClass) {
    const retired = parseJson(tokenClass.retired);
    if (retired.length > 0) {
      const tokens = retired.filter((r) => r.id === id);
      if (tokens.length > 0) {
        return {
          id: tokens[0].id,
          amount: tokens[0].amount,
          owner: tokens[0].owner,
        };
      } else {
        return {};
      }
    } else {
      return {};
    }
  } else {
    return {};
  }
};

export const getTokenCancelledAmount = async (name: string, id: string) => {
  const tokenClass = await prisma.tokenClass.findFirst({
    where: {
      name: name,
    },
  });
  if (tokenClass) {
    const cancelled = parseJson(tokenClass.cancelled);
    if (cancelled.length > 0) {
      const tokens = cancelled.filter((c) => c.id === id);
      if (tokens.length > 0) {
        return {
          id: tokens[0].id,
          amount: tokens[0].amount,
          owner: tokens[0].owner,
        };
      } else {
        return {};
      }
    } else {
      return {};
    }
  } else {
    return {};
  }
};
