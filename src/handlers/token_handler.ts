import { parseJson, prisma } from "../prisma/prisma_client";

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

export const getTokensTotalByAddress = async (
  address: string,
  name?: string
) => {
  const tokens = await getAccountTokens(address, name);
  Object.keys(tokens).forEach((key) => {
    const newTokens = {};
    Object.values(tokens[key].tokens).forEach((t: any) => {
      if (!newTokens[t.collection]) {
        newTokens[t.collection] = {
          amount: t.amount,
          minted: t.minted,
          retired: t.retired,
        };
      } else {
        newTokens[t.collection].amount += t.amount;
        newTokens[t.collection].minted += t.minted;
        newTokens[t.collection].retired += t.retired;
      }
    });
    tokens[key].tokens = newTokens;
  });
  return tokens;
};

export const getTokensTotalForEntities = async (
  address: string,
  name?: string
) => {
  const entities =
    (await prisma.entity.findMany({
      where: { owner: address, type: "asset/device" },
      select: { id: true, accounts: true },
    })) || [];

  const tokens = entities.map(async (entity) => {
    const entityTokens = await getTokensTotalByAddress(
      parseJson(entity.accounts).find((a) => a.name === "admin")?.address,
      name
    );
    return { entity: entity.id, tokens: entityTokens };
  });

  const tokensTotal = await Promise.all(tokens);

  return tokensTotal.filter((t) => Object.keys(t.tokens).length > 0);
};

export const getAccountTokens = async (address: string, name?: string) => {
  const tokenTransactions = await prisma.tokenTransaction.findMany({
    where: {
      OR: [{ from: address }, { to: address }],
      ...(name && { Token: { name: name } }),
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
          retired: 0,
        };
      }
      // if no to it means was retired from this address
      if (!curr.to) {
        tokens[curr.Token.name].tokens[curr.tokenId].retired += Number(
          curr.amount
        );
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
          retired: 0,
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

export const getTokensTotalAmountByAddress = async (
  address: string,
  name?: string
) => {
  const tokens = await getAccountTokens(address, name);
  Object.keys(tokens).forEach((key) => {
    let amount = Object.values(tokens[key].tokens).reduce(
      (r: any, t: any) => r + (t.amount ?? 0),
      0
    );
    tokens[key] = amount;
  });
  return tokens;
};

export const getTokensTotalMintedByAddress = async (
  address: string,
  name?: string
) => {
  const tokens = await getAccountTokens(address, name);
  Object.keys(tokens).forEach((key) => {
    let minted = Object.values(tokens[key].tokens).reduce(
      (r: any, t: any) => r + (t.minted ?? 0),
      0
    );
    tokens[key] = minted;
  });
  return tokens;
};

export const getTokensTotalRetiredByAddress = async (
  address: string,
  name?: string
) => {
  const tokens = await getAccountTokens(address, name);
  Object.keys(tokens).forEach((key) => {
    let retired = Object.values(tokens[key].tokens).reduce(
      (r: any, t: any) => r + (t.retired ?? 0),
      0
    );
    tokens[key] = retired;
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
