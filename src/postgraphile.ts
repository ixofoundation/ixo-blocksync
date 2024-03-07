import postgraphile from "postgraphile";
import PgSimplifyInflectorPlugin from "@graphile-contrib/pg-simplify-inflector";
import ConnectionFilterPlugin from "postgraphile-plugin-connection-filter";
import PgAggregatesPlugin from "@graphile/pg-aggregates";
import { DATABASE_URL } from "./util/secrets";
import {
  EntityPlugin,
  createFullEntityLoader,
  createParentEntityLoader,
} from "./graphql/entity";
import { ClaimsPlugin } from "./graphql/claims";
import {
  TokenPlugin,
  createGetAccountTransactionsLoader,
} from "./graphql/token";
import { TokenomicsPlugin } from "./graphql/tokenomics";
import { SmartTagsPlugin } from "./graphql/smart_tags_plugin";

const isProd = process.env.NODE_ENV === "production";

export const Postgraphile = postgraphile(DATABASE_URL, "public", {
  ...(isProd
    ? {
        // all prod only options
        retryOnInitFail: true,
        extendedErrors: ["errcode"],
        disableQueryLog: true,
        allowExplain: false,
      }
    : {
        // all dev only options
        showErrorStack: "json",
        extendedErrors: ["hint", "detail", "errcode"],
        allowExplain: true,
      }),
  exportGqlSchemaPath: "public/graphql/schema.graphql",
  enableQueryBatching: true,
  legacyRelations: "omit",
  watchPg: true,
  enableCors: true,
  bodySizeLimit: "500kB",
  graphiql: true,
  enhanceGraphiql: true,
  dynamicJson: true,
  setofFunctionsContainNulls: false,
  ignoreRBAC: false,
  disableDefaultMutations: true,
  additionalGraphQLContextFromRequest: async (req, res) => {
    const parentEntityLoader = createParentEntityLoader();
    return {
      entityLoader: createFullEntityLoader(parentEntityLoader),
      getAccountTransactionsLoader: createGetAccountTransactionsLoader(),
    };
  },
  subscriptions: true,
  pgSettings: {
    // place a timeout on the database operations, this will halt any query that takes longer than the specified number of milliseconds to execute.
    statement_timeout: "4000",
  },
  appendPlugins: [
    SmartTagsPlugin,
    TokenPlugin,
    ClaimsPlugin,
    EntityPlugin,
    TokenomicsPlugin,
    PgSimplifyInflectorPlugin,
    ConnectionFilterPlugin,
    PgAggregatesPlugin,
  ],
  // Optional customisation
  graphileBuildOptions: {
    // --------------------------------------------
    // PgSimplifyInflectorPlugin Options
    // --------------------------------------------
    /*
     * Uncomment if you want simple collections to lose the 'List' suffix
     * (and connections to gain a 'Connection' suffix).
     */
    //pgOmitListSuffix: true,
    /*
     * Uncomment if you want 'userPatch' instead of 'patch' in update
     * mutations.
     */
    //pgSimplifyPatch: false,
    /*
     * Uncomment if you want 'allUsers' instead of 'users' at root level.
     */
    //pgSimplifyAllRows: false,
    /*
     * Uncomment if you want primary key queries and mutations to have
     * `ById` (or similar) suffix; and the `nodeId` queries/mutations
     * to lose their `ByNodeId` suffix.
     */
    // pgShortPk: true,

    // --------------------------------------------
    // ConnectionFilterPlugin Options
    // --------------------------------------------
    // Restrict filtering to specific operators:
    // connectionFilterAllowedOperators: [
    //   "isNull",
    //   "equalTo",
    //   "notEqualTo",
    //   "distinctFrom",
    //   "notDistinctFrom",
    //   "lessThan",
    //   "lessThanOrEqualTo",
    //   "greaterThan",
    //   "greaterThanOrEqualTo",
    //   "in",
    //   "notIn",
    // ],
    // Restrict filtering to specific field types:
    // connectionFilterAllowedFieldTypes: ["String", "Int"],
    // Enable/disable filtering on PostgreSQL arrays:
    // connectionFilterArrays: false, // default: true
    // Enable/disable filtering by computed columns:
    // connectionFilterComputedColumns: false, // default: true
    // Use alternative names (e.g. eq, ne) for operators:
    // connectionFilterOperatorNames: {
    //   equalTo: "eq",
    //   notEqualTo: "ne",
    // },
    // Enable/disable filtering on related fields:
    connectionFilterRelations: true, // default: false
    // Enable/disable filtering on functions that return setof:
    // connectionFilterSetofFunctions: false, // default: true
    // Enable/disable filtering with logical operators (and/or/not):
    // connectionFilterLogicalOperators: false, // default: true
    // Allow/forbid null literals in input:
    connectionFilterAllowNullInput: true, // default: false
    // Allow/forbid empty objects ({}) in input:
    connectionFilterAllowEmptyObjectInput: true, // default: false

    // --------------------------------------------
    // PgAggregatesPlugin Options
    // --------------------------------------------
    // Disable aggregates by default; opt each table in via the `@aggregates` smart tag
    disableAggregatesByDefault: true,
    // enable certain tables only in the smart tags plugin at /src/graphql/smart_tags_plugin.ts
  },
});
