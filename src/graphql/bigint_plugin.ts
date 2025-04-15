// import { GraphQLScalarType } from "graphql";
// import { Plugin } from "graphile-build";

// // Create a custom scalar (with a different name to avoid conflict)
// const SmartNumericType = new GraphQLScalarType({
//   name: "SmartNumeric", // Different name to avoid conflict with BigInt
//   description: "Custom scalar type for handling NUMERIC values intelligently",

//   // Convert outgoing values (DB to client)
//   serialize(value) {
//     console.log("SmartNumeric serialize called with:", value);
//     if (value === null) return null;
//     // Return as number if within safe integer range, otherwise as string
//     const num = Number(value);
//     return Number.isSafeInteger(num) ? num : value.toString();
//   },

//   // Convert incoming values (client to DB)
//   parseValue(value) {
//     console.log("SmartNumeric parseValue called with:", value);
//     if (value === null) return null;
//     if (typeof value === "string") {
//       const num = Number(value);
//       if (Number.isNaN(num)) {
//         throw new Error(
//           "SmartNumeric cannot represent non-numeric value: " + value
//         );
//       }
//       return num;
//     }
//     if (typeof value === "number") {
//       if (!Number.isFinite(value)) {
//         throw new Error(
//           "SmartNumeric cannot represent non-finite value: " + value
//         );
//       }
//       return value;
//     }
//     throw new Error(
//       "SmartNumeric cannot represent non-numeric value: " + value
//     );
//   },

//   // Convert incoming literal values in queries
//   parseLiteral(ast) {
//     console.log("SmartNumeric parseLiteral called");
//     if (ast.kind === "IntValue" || ast.kind === "FloatValue") {
//       const num = Number(ast.value);
//       if (Number.isNaN(num)) {
//         throw new Error(
//           "SmartNumeric cannot represent non-numeric value: " + ast.value
//         );
//       }
//       return num;
//     }
//     if (ast.kind === "StringValue") {
//       const num = Number(ast.value);
//       if (Number.isNaN(num)) {
//         throw new Error(
//           "SmartNumeric cannot represent non-numeric value: " + ast.value
//         );
//       }
//       return num;
//     }
//     throw new Error(
//       "SmartNumeric cannot represent non-numeric value: " + ast.kind
//     );
//   },
// });

// // Plugin to override how numeric fields are handled
// export const SmartNumericPlugin: Plugin = (builder) => {
//   // First add our custom scalar type
//   builder.hook("build", (build) => {
//     build.addType(SmartNumericType);
//     return build;
//   });

//   // Then add a hook to intercept numeric fields and replace with our custom scalar
//   builder.hook("GraphQLObjectType:fields:field", (field, build, context) => {
//     const {
//       scope: { pgFieldIntrospection },
//     } = context;

//     // Skip if this isn't a PostgreSQL field
//     if (!pgFieldIntrospection) {
//       return field;
//     }

//     // Check if this is a numeric field from ClaimCollection
//     if (
//       // pgFieldIntrospection.type.name === "numeric" &&
//       // pgFieldIntrospection.class &&
//       // pgFieldIntrospection.class.name === "ClaimCollection" &&
//       // [
//       //   "quota",
//       //   "count",
//       //   "evaluated",
//       //   "approved",
//       //   "rejected",
//       //   "disputed",
//       //   "invalidated",
//       // ].includes(pgFieldIntrospection.name)
//       pgFieldIntrospection.type.name === "numeric"
//     ) {
//       console.log(
//         `Replacing field ${pgFieldIntrospection.name} with SmartNumeric type`
//       );

//       // Replace the type with our custom scalar
//       return {
//         ...field,
//         type: SmartNumericType,
//       };
//     }

//     return field;
//   });
// };
