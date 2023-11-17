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
        getAccountTokens(
          address: String!
          name: String
          allEntityRetired: Boolean
        ): JSON!
        getTokensTotalByAddress(
          address: String!
          name: String
          allEntityRetired: Boolean
        ): JSON!
        getTokensTotalForEntities(
          address: String!
          name: String
          allEntityRetired: Boolean
        ): JSON!
        getTokensTotalForCollection(
          did: String!
          name: String
          allEntityRetired: Boolean
        ): JSON!
        getTokensTotalForCollectionAmounts(
          did: String!
          name: String
          allEntityRetired: Boolean
        ): JSON!
      }
    `,
    resolvers: {
      Query: {
        getAccountTokens: async (c, args, ctx, rInfo) => {
          return await TokenHandler.getAccountTokens(
            args.address,
            args.name,
            ctx.getAccountTransactionsLoader,
            args.allEntityRetired
          );
        },
        getTokensTotalByAddress: async (c, args, ctx, rInfo) => {
          return await TokenHandler.getTokensTotalByAddress(
            args.address,
            args.name,
            ctx.getAccountTransactionsLoader,
            args.allEntityRetired
          );
        },
        getTokensTotalForEntities: async (c, args, ctx, rInfo) => {
          return await TokenHandler.getTokensTotalForEntities(
            args.address,
            args.name,
            ctx.getAccountTransactionsLoader,
            args.allEntityRetired
          );
        },
        getTokensTotalForCollection: async (c, args, ctx, rInfo) => {
          return await TokenHandler.getTokensTotalForCollection(
            args.did,
            args.name,
            ctx.getAccountTransactionsLoader,
            args.allEntityRetired
          );
        },
        getTokensTotalForCollectionAmounts: async (c, args, ctx, rInfo) => {
          return await TokenHandler.getTokensTotalForCollectionAmounts(
            args.did,
            args.name,
            ctx.getAccountTransactionsLoader,
            args.allEntityRetired
          );
        },
      },
    },
  };
});
