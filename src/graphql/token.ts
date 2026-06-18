import { makeExtendSchemaPlugin, gql } from "graphile-utils";
import * as TokenHandler from "../handlers/token_handler";
import {
  AccountTokenBalance,
  getAccountTokenBalancesBatch,
} from "../postgres/token";
import DataLoader from "dataloader";

export type GetAccountTransactionsLoader = ReturnType<
  typeof createGetAccountTransactionsLoader
>;

// Per-request loader over per-(address, tokenId) balances. Keys are
// "address-name" (see createGetAccountTransactionsKey). Addresses never contain
// "-", so we split on the first one. All keys requested in the same tick are
// collapsed into one DB query per distinct name filter (`address = ANY(...)`),
// which turns the entity / collection fan-out resolvers from N round-trips into
// one.
export const createGetAccountTransactionsLoader = () => {
  return new DataLoader<string, AccountTokenBalance[]>(
    async (keys: readonly string[]) => {
      // group requested addresses by their name filter
      const byName = new Map<string | null, Set<string>>();
      for (const key of keys) {
        const sep = key.indexOf("-");
        const address = key.slice(0, sep);
        const rawName = key.slice(sep + 1);
        const name = rawName === "NULL" ? null : rawName;
        if (!byName.has(name)) byName.set(name, new Set());
        byName.get(name)!.add(address);
      }

      // one query per distinct name filter, then index rows by address
      const rowsByKey = new Map<string, AccountTokenBalance[]>();
      await Promise.all(
        [...byName.entries()].map(async ([name, addresses]) => {
          const rows = await getAccountTokenBalancesBatch([...addresses], name);
          for (const row of rows) {
            const key = `${row.address}-${name ?? "NULL"}`;
            const list = rowsByKey.get(key);
            if (list) list.push(row);
            else rowsByKey.set(key, [row]);
          }
        })
      );

      return keys.map((key) => rowsByKey.get(key) ?? []);
    }
  );
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
        # getAccountTokens2(
        #   address: String!
        #   name: String
        #   allEntityRetired: Boolean
        # ): JSON!
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
        // getAccountTokens2: async (c, args, ctx, rInfo) => {
        //   return await TokenHandler.getAccountTokens2(
        //     args.address,
        //     args.name,
        //     args.allEntityRetired
        //   );
        // },
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
