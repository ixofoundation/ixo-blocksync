import { prisma } from "../prisma/prisma_client";

export const createGetAccountTransactionsKey = (
  id: string,
  name?: string | null | undefined
): string => {
  return `${id}-${name || "NULL"}`;
};

export const getTokensTotalByAddress = async (
  address: string,
  name?: string,
  transactionsLoader?
) => {
  const tokens = await getAccountTokens(address, name, transactionsLoader);
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
  name?: string,
  transactionsLoader?
) => {
  const entities = await prisma.entity.findMany({
    where: { owner: address, type: "asset/device" },
    select: { id: true, accounts: true },
  });

  const tokens = entities.map(async (entity: any) => {
    const entityTokens = await getTokensTotalByAddress(
      entity.accounts.find((a) => a.name === "admin")?.address,
      name,
      transactionsLoader
    );
    return { entity: entity.id, tokens: entityTokens };
  });

  const tokensTotal = await Promise.all(tokens);

  return tokensTotal.filter((t) => Object.keys(t.tokens).length > 0);
};

export const getAccountTransactions = async (
  address: string,
  name?: string
) => {
  if (!address) return [];

  const PAGE_SIZE = 30000; // Fetch 10,000 records at a time. Adjust as per your needs.
  let tokenTransactions: any[] = [];
  let skip = 0;

  while (true) {
    const tokens = await prisma.tokenTransaction.findMany({
      where: {
        OR: [{ from: address }, { to: address }],
        ...(name && { Token: { name: name } }),
      },
      select: {
        from: true,
        to: true,
        amount: true,
        tokenId: true,
        Token: {
          select: { name: true, collection: true },
        },
      },
      skip: skip,
      take: PAGE_SIZE,
    });

    // Exit the loop if no more records are found.
    if (tokens.length === 0) break;

    tokenTransactions.push(...tokens);
    skip += PAGE_SIZE;
  }
  return tokenTransactions;
};

// Get all the tokens for an account and returns them in a format that is easy to work with:
// {
//   [NAME]: {
//     contractAddress: "",
//     description: "",
//     image: "",
//     tokens: {
//       [ID]: {
//         collection: "",
//         amount: 0,
//         minted: 0,
//         retired: 0,
//       },
//     },
//   }
// }
export const getAccountTokens = async (
  address: string,
  name?: string,
  transactionLoader?
) => {
  let tokenTransactions: any[] = transactionLoader
    ? await transactionLoader.load(
        createGetAccountTransactionsKey(address, name)
      )
    : await getAccountTransactions(address, name);

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

export const getTokensTotalForCollection = async (
  did: string,
  name?: string,
  transactionLoader?
) => {
  const entities = await prisma.entity.findMany({
    where: {
      IID: {
        context: {
          array_contains: [{ val: did }],
        },
      },
    },
    select: { id: true, accounts: true },
  });

  const tokens = entities.map(async (entity) => {
    const entityTokens = await getTokensTotalByAddress(
      (entity.accounts as any).find((a) => a.name === "admin")?.address,
      name,
      transactionLoader
    );
    return { entity: entity.id, tokens: entityTokens };
  });

  const tokensTotal = await Promise.all(tokens);

  return tokensTotal.filter((t) => Object.keys(t.tokens).length > 0);
};

export const getTokensTotalForCollectionAmounts = async (
  did: string,
  name?: string,
  transactionLoader?
) => {
  const tokens = await getTokensTotalForCollection(
    did,
    name,
    transactionLoader
  );
  let newTokens = {};
  tokens.forEach((t) => {
    Object.keys(t.tokens).forEach((key) => {
      const amounts = {
        amount: t.tokens[key].tokens[did].amount,
        minted: t.tokens[key].tokens[did].minted,
        retired: t.tokens[key].tokens[did].retired,
      };
      if (!newTokens[key]) {
        newTokens[key] = amounts;
      } else {
        newTokens[key].amount += amounts.amount;
        newTokens[key].retired += amounts.retired;
        newTokens[key].minted += amounts.minted;
      }
    });
  });
  return newTokens;
};
