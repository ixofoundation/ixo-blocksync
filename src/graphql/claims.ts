import { makeExtendSchemaPlugin, gql } from "graphile-utils";
import * as ClaimsHandler from "../handlers/claims_handler";

export const ClaimsPlugin = makeExtendSchemaPlugin((build) => {
  const { pgSql: sql, inflection } = build;

  return {
    typeDefs: gql`
      extend type ClaimsConnection {
        """
        # Checks if there are any claims with null schemaType
        """
        claimSchemaTypesLoaded: Boolean!
      }
    `,
    resolvers: {
      ClaimsConnection: {
        claimSchemaTypesLoaded: async (connection, args, ctx, rInfo) => {
          return (
            (await ClaimsHandler.getAllCollectionClaimTypesNull()).length < 1
          );
        },
      },
    },
  };
});
