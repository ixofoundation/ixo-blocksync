import { prisma } from "../prisma/prisma_client";

export const getTokenClassByContractAddress = async (
  contractAddress: string
) => {
  const tokenClass = await prisma.tokenClass.findFirst({
    where: { contractAddress: contractAddress },
    include: {
      retired: true,
      cancelled: true,
    },
  });
  return tokenClass;
};

export const getTokenClassByName = async (name: string) => {
  const tokenClass = await prisma.tokenClass.findFirst({
    where: { name: name },
    include: {
      retired: true,
      cancelled: true,
    },
  });
  return tokenClass;
};

export const getTokenClassesByClass = async (id: string) => {
  const tokenClasses = await prisma.tokenClass.findMany({
    where: { class: id },
    include: {
      retired: true,
      cancelled: true,
    },
  });
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
    where: { id: id },
    include: { tokenData: true },
  });
};

export const getTokensByEntityId = async (id: string) => {
  return prisma.token.findMany({
    where: {
      tokenData: {
        some: { id: id },
      },
    },
    include: {
      tokenData: true,
    },
  });
};

export const getTokensByCollection = async (id: string) => {
  return prisma.token.findMany({
    where: { collection: id },
    include: {
      tokenData: true,
    },
  });
};

export const getRetiredTokens = async (id: string) => {
  return prisma.token.findMany({
    where: { collection: id },
    include: {
      tokenData: true,
    },
  });
};

export const getAccountTokens = async (address: string, name: string) => {
  const tokenTransactions = await prisma.tokenTransaction.findMany({
    where: {
      OR: [{ from: address }, { to: address }],
    },
    include: {
      Token: {
        select: { name: true, collection: true },
      },
    },
  });

  const tokens = {};
  for (const curr of tokenTransactions) {
    if (!tokens[curr.Token.name]) {
      const tokenClass = await prisma.tokenClass.findFirst({
        where: { name: curr.Token.name },
      });
      tokens[curr.Token.name] = {
        contractAddress: tokenClass?.contractAddress,
        description: tokenClass?.description,
        image: tokenClass?.image,
        tokens: {},
      };
    }

    // if from address is same it means it is an outgoing transaction in relation to the address
    if (curr.from === address) {
      if (tokens[curr.Token.name].tokens[curr.tokenId]) {
        tokens[curr.Token.name].tokens[curr.tokenId].amount -= Number(
          curr.amount
        );
      } else {
        tokens[curr.Token.name].tokens[curr.tokenId] = {
          collection: curr.Token.collection,
          amount: -Number(curr.amount),
          minted: 0,
        };
      }
      // if to address is same it means it is an incoming transaction in relation to the address
    } else {
      if (tokens[curr.Token.name].tokens[curr.tokenId]) {
        tokens[curr.Token.name].tokens[curr.tokenId].amount += Number(
          curr.amount
        );
      } else {
        tokens[curr.Token.name].tokens[curr.tokenId] = {
          collection: curr.Token.collection,
          amount: Number(curr.amount),
          minted: 0,
        };
      }
      // if no from it means was minted to address
      if (!curr.from) {
        tokens[curr.Token.name].tokens[curr.tokenId].minted += Number(
          curr.amount
        );
      }
    }
  }

  Object.entries(tokens).forEach(([key, value]: any[]) => {
    Object.entries(value.tokens).forEach(([key2, value2]: any[]) => {
      if (value2.amount === 0 && value2.minted === 0) delete tokens[key][key2];
    });
    if (Object.keys(tokens[key].tokens).length === 0) delete tokens[key];
  });

  return tokens;
};

// export const getTokenRetiredAmount = async (name: string, id: string) => {
//   const tokenClass = await prisma.tokenClass.findFirst({
//     where: { name: name },
//   });
//   if (tokenClass) {
//     const retired = parseJson(tokenClass.retired);
//     if (retired.length > 0) {
//       const tokens = retired.filter((r) => r.id === id);
//       if (tokens.length > 0) {
//         return {
//           id: tokens[0].id,
//           amount: tokens[0].amount,
//           owner: tokens[0].owner,
//         };
//       } else {
//         return {};
//       }
//     } else {
//       return {};
//     }
//   } else {
//     return {};
//   }
// };
