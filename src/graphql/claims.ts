import { makeExtendSchemaPlugin, gql } from "graphile-utils";
import * as ClaimsHandler from "../handlers/claims_handler";

export const ClaimsPlugin = makeExtendSchemaPlugin((build) => {
  const { pgSql: sql, inflection } = build;

  return {
    typeDefs: gql`
      extend type ClaimCollection {
        """
        Checks if there are any claims with null schemaType
        """
        claimSchemaTypesLoaded: Boolean!
      }
    `,
    resolvers: {
      ClaimCollection: {
        claimSchemaTypesLoaded: async (connection, args, ctx, rInfo) => {
          return await ClaimsHandler.getCollectionClaimSchemaTypesLoaded(
            connection.id
          );
        },
      },
    },
  };
});
