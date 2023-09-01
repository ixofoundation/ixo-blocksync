import { makeExtendSchemaPlugin, gql } from "graphile-utils";
import * as TokenHandler from "../handlers/token_handler";
import DataLoader from "dataloader";

export const createGetAccountTransactionsLoader = () => {
  return new DataLoader(async (keys: string[]) => {
    return keys.map(async (key) => {
      const [id, name] = key.split("-");
      const actualName = name === "NULL" ? undefined : name;
      return await TokenHandler.getAccountTransactions(id, actualName);
    });
  });
};

export const TokenPlugin = makeExtendSchemaPlugin((build) => {
  const { pgSql: sql, inflection } = build;

  return {
    typeDefs: gql`
      extend type Query {
        getAccountTokens(address: String!, name: String): JSON!
        getTokensTotalByAddress(address: String!, name: String): JSON!
        getTokensTotalForEntities(address: String!, name: String): JSON!
        getTokensTotalForCollection(did: String!, name: String): JSON!
        getTokensTotalForCollectionAmounts(did: String!, name: String): JSON!
      }
    `,
    resolvers: {
      Query: {
        getAccountTokens: async (c, args, ctx, rInfo) => {
          return await TokenHandler.getAccountTokens(
            args.address,
            args.name,
            ctx.getAccountTransactionsLoader
          );
        },
        getTokensTotalByAddress: async (c, args, ctx, rInfo) => {
          return await TokenHandler.getTokensTotalByAddress(
            args.address,
            args.name,
            ctx.getAccountTransactionsLoader
          );
        },
        getTokensTotalForEntities: async (c, args, ctx, rInfo) => {
          return await TokenHandler.getTokensTotalForEntities(
            args.address,
            args.name,
            ctx.getAccountTransactionsLoader
          );
        },
        getTokensTotalForCollection: async (c, args, ctx, rInfo) => {
          return await TokenHandler.getTokensTotalForCollection(
            args.did,
            args.name,
            ctx.getAccountTransactionsLoader
          );
        },
        getTokensTotalForCollectionAmounts: async (c, args, ctx, rInfo) => {
          return await TokenHandler.getTokensTotalForCollectionAmounts(
            args.did,
            args.name,
            ctx.getAccountTransactionsLoader
          );
        },
      },
    },
  };
});
