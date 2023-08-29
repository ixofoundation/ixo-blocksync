import { prisma } from "../prisma/prisma_client";
import { makeExtendSchemaPlugin, gql } from "graphile-utils";

export const IidPlugin = makeExtendSchemaPlugin((build) => {
  const { pgSql: sql, inflection } = build;

  return {
    typeDefs: gql`
      extend type Query {
        getIidByIid(id: String!): Iid
      }
    `,
    resolvers: {
      Query: {
        testGetIidByIid: async (_query, args, context, resolveInfo) => {
          const iid = await prisma.iID.findFirst({
            where: {
              id: args.id,
            },
          });
          return iid;
        },
      },
    },
  };
});
