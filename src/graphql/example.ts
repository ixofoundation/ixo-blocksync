import {
  makeExtendSchemaPlugin,
  gql,
  makeWrapResolversPlugin,
} from "graphile-utils";

// Example of a plugin that adds a new query
export const IidPlugin = makeExtendSchemaPlugin((build) => {
  const { pgSql: sql, inflection } = build;

  return {
    typeDefs: gql`
      type Setting {
        type: String!
        # setting: LinkedResource!
      }

      extend type Query {
        getIidByIid(id: String!): Iid
      }
    `,
    resolvers: {
      Query: {
        testGetIidByIid: async (_query, args, context, resolveInfo) => {
          const iid = { id: args.id }; // can do sql or async stuff here
          return iid;
        },
      },
    },
  };
});

// Example of a plugin that wraps resolvers
export const testPlugin = makeWrapResolversPlugin({
  Entity: {
    async id(resolver, entity, args, context, resolveInfo) {
      const result = await resolver(entity, args, context, resolveInfo);
      console.log(`entity.id output for entity ${entity.id}:`, result);
      return result;
    },
  },
});
