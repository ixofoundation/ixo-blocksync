import { makeExtendSchemaPlugin, gql } from "graphile-utils";
import * as TokenomicsHandler from "../handlers/tokenomics_handler";

export const TokenomicsPlugin = makeExtendSchemaPlugin((build) => {
  const { pgSql: sql, inflection } = build;

  return {
    typeDefs: gql`
      extend type Query {
        tokenomicsSupplyTotal: JSON!
        tokenomicsSupplyCommunityPool: JSON!
        tokenomicsInflation: JSON!
        tokenomicsSupplyStaked: JSON!
        tokenomicsSupplyIBC: JSON!
      }
    `,
    resolvers: {
      Query: {
        tokenomicsSupplyTotal: async (c, args, ctx, rInfo) => {
          return await TokenomicsHandler.supplyTotal();
        },
        tokenomicsSupplyCommunityPool: async (c, args, ctx, rInfo) => {
          return await TokenomicsHandler.supplyCommunityPool();
        },
        tokenomicsInflation: async (c, args, ctx, rInfo) => {
          return await TokenomicsHandler.inflation();
        },
        tokenomicsSupplyStaked: async (c, args, ctx, rInfo) => {
          return await TokenomicsHandler.supplyStaked();
        },
        tokenomicsSupplyIBC: async (c, args, ctx, rInfo) => {
          return await TokenomicsHandler.supplyIBC();
        },
      },
    },
  };
});
