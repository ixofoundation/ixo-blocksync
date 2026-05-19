import { makeJSONPgSmartTagsPlugin } from "graphile-utils";

export const SmartTagsPlugin = makeJSONPgSmartTagsPlugin({
  version: 1,
  config: {
    class: {
      "public.TokenTransaction": {
        tags: {
          aggregates: "on",
        },
      },
      "public.TokenRetired": {
        tags: {
          aggregates: "on",
        },
      },
      "public.TokenCancelled": {
        tags: {
          aggregates: "on",
        },
      },
    },
    constraint: {
      // The Message->Transaction FK now points at Transaction.id (surrogate PK),
      // but we keep its constraint name and override the auto-generated GraphQL
      // relation names so existing clients (`transactionByTransactionHash` /
      // `messagesByTransactionHash`) keep working unchanged.
      // PostGraphile smart-tag direction:
      //   `fieldName`        names the field on the LOCAL (FK-bearing) table
      //                      that returns the single FOREIGN row.
      //   `foreignFieldName` names the field on the FOREIGN (referenced) table
      //                      that returns the CONNECTION of LOCAL rows.
      // For Message → Transaction:
      //   Message.transactionByTransactionHash returns one Transaction
      //   Transaction.messagesByTransactionHash returns a MessagesConnection
      "public.Message.Message_transactionHash_fkey": {
        tags: {
          fieldName: "transactionByTransactionHash",
          foreignFieldName: "messagesByTransactionHash",
        },
      },
    },
  },
});
