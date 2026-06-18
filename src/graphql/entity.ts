import { makeExtendSchemaPlugin, gql } from "graphile-utils";
import DataLoader from "dataloader";
import * as EntityHandler from "../handlers/entity_handler";

// One batched IID read per request → serves the 12 passthrough DID fields.
export type IidLoader = ReturnType<typeof createIidLoader>;
export const createIidLoader = () =>
  new DataLoader<string, any>((ids) => EntityHandler.loadIidPassthrough(ids));

// One batched recursive read + in-memory inheritance merge per request → serves
// the 3 inheritance-resolved fields (service, linkedResource, settings).
export type ResolvedEntityLoader = ReturnType<
  typeof createResolvedEntityLoader
>;
export const createResolvedEntityLoader = () =>
  new DataLoader<string, any>((ids) =>
    EntityHandler.loadResolvedEntities(ids)
  );

export const EntityPlugin = makeExtendSchemaPlugin((build) => {
  const { pgSql: sql, inflection } = build;

  return {
    typeDefs: gql`
      extend type Query {
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
      Query: {
        deviceExternalIdsLoaded: async (c, args, ctx, rInfo) => {
          return await EntityHandler.deviceExternalIdsLoaded();
        },
      },
      Entity: {
        // --- 12 passthrough fields: served from the entity's own IID row ---
        context: async (entity, args, ctx, rInfo) => {
          return (await ctx.iidLoader.load(entity.__identifiers[0]))?.context;
        },
        controller: async (entity, args, ctx, rInfo) => {
          return (await ctx.iidLoader.load(entity.__identifiers[0]))?.controller;
        },
        verificationMethod: async (entity, args, ctx, rInfo) => {
          return (await ctx.iidLoader.load(entity.__identifiers[0]))
            ?.verificationMethod;
        },
        authentication: async (entity, args, ctx, rInfo) => {
          return (await ctx.iidLoader.load(entity.__identifiers[0]))
            ?.authentication;
        },
        assertionMethod: async (entity, args, ctx, rInfo) => {
          return (await ctx.iidLoader.load(entity.__identifiers[0]))
            ?.assertionMethod;
        },
        keyAgreement: async (entity, args, ctx, rInfo) => {
          return (await ctx.iidLoader.load(entity.__identifiers[0]))
            ?.keyAgreement;
        },
        capabilityInvocation: async (entity, args, ctx, rInfo) => {
          return (await ctx.iidLoader.load(entity.__identifiers[0]))
            ?.capabilityInvocation;
        },
        capabilityDelegation: async (entity, args, ctx, rInfo) => {
          return (await ctx.iidLoader.load(entity.__identifiers[0]))
            ?.capabilityDelegation;
        },
        linkedClaim: async (entity, args, ctx, rInfo) => {
          return (await ctx.iidLoader.load(entity.__identifiers[0]))
            ?.linkedClaim;
        },
        accordedRight: async (entity, args, ctx, rInfo) => {
          return (await ctx.iidLoader.load(entity.__identifiers[0]))
            ?.accordedRight;
        },
        linkedEntity: async (entity, args, ctx, rInfo) => {
          return (await ctx.iidLoader.load(entity.__identifiers[0]))
            ?.linkedEntity;
        },
        alsoKnownAs: async (entity, args, ctx, rInfo) => {
          return (await ctx.iidLoader.load(entity.__identifiers[0]))
            ?.alsoKnownAs;
        },
        // --- 3 inheritance-resolved fields: merged up the class chain ---
        service: async (entity, args, ctx, rInfo) => {
          return (await ctx.resolvedEntityLoader.load(entity.__identifiers[0]))
            .service;
        },
        linkedResource: async (entity, args, ctx, rInfo) => {
          return (await ctx.resolvedEntityLoader.load(entity.__identifiers[0]))
            .linkedResource;
        },
        settings: async (entity, args, ctx, rInfo) => {
          return (await ctx.resolvedEntityLoader.load(entity.__identifiers[0]))
            .settings;
        },
      },
    },
  };
});
