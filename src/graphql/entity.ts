import { makeExtendSchemaPlugin, gql } from "graphile-utils";
import DataLoader from "dataloader";
import * as EntityHandler from "../handlers/entity_handler";

export const createParentEntityLoader = () => {
  return new DataLoader(async (ids: string[]) => {
    return ids.map(async (id) => await EntityHandler.getParentEntityById(id));
  });
};

export const createFullEntityLoader = (parentEntityLoader) => {
  return new DataLoader(async (ids: string[]) => {
    return ids.map(
      async (id) =>
        await EntityHandler.getFullEntityById(id, parentEntityLoader)
    );
  });
};

export const EntityPlugin = makeExtendSchemaPlugin((build) => {
  const { pgSql: sql, inflection } = build;

  return {
    typeDefs: gql`
      extend type EntitiesConnection {
        """
        Checks if there are any asset/device entities with null externalId
        """
        deviceExternalIdsLoaded: Boolean!
      }

      extend type Entity {
        context: JSON!
        controller: [String!]!
        verificationMethod: JSON!
        service: JSON!
        authentication: [String!]!
        assertionMethod: [String!]!
        keyAgreement: [String!]!
        capabilityInvocation: [String!]!
        capabilityDelegation: [String!]!
        linkedResource: JSON!
        linkedClaim: JSON!
        accordedRight: JSON!
        linkedEntity: JSON!
        alsoKnownAs: String!
        settings: JSON!
      }
    `,
    resolvers: {
      EntitiesConnection: {
        deviceExternalIdsLoaded: async (connection, args, ctx, rInfo) => {
          return await EntityHandler.deviceExternalIdsLoaded();
        },
      },
      Entity: {
        context: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0])).context;
        },
        controller: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .controller;
        },
        verificationMethod: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .verificationMethod;
        },
        service: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0])).service;
        },
        authentication: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .authentication;
        },
        assertionMethod: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .assertionMethod;
        },
        keyAgreement: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .keyAgreement;
        },
        capabilityInvocation: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .capabilityInvocation;
        },
        capabilityDelegation: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .capabilityDelegation;
        },
        linkedResource: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .linkedResource;
        },
        linkedClaim: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .linkedClaim;
        },
        accordedRight: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .accordedRight;
        },
        linkedEntity: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .linkedEntity;
        },
        alsoKnownAs: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .alsoKnownAs;
        },
        settings: async (entity, args, ctx, rInfo) => {
          return (await ctx.entityLoader.load(entity.__identifiers[0]))
            .settings;
        },
      },
    },
  };
});
