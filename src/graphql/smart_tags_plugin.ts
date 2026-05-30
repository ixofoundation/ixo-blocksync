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
      // v7 turned Evaluation into 1:N (history) — to keep the pre-v7
      // GraphQL shape working, Claim has a forward FK
      // `currentEvaluationId → Evaluation(id)`. By default Postgraphile
      // would expose that as `Claim.currentEvaluation`; this tag renames
      // the field back to `Claim.evaluation` so existing clients don't
      // notice the change. The 1:N backward relation is still exposed
      // alongside it as the evaluations connection on Claim.
      "public.Claim.Claim_currentEvaluationId_fkey": {
        tags: {
          fieldName: "evaluation",
        },
      },
      // DisputeResolution is 1:1 with Dispute (disputeId is both PK and FK).
      // Postgraphile would auto-expose the backward singular field on
      // Dispute as `disputeResolutionByDisputeId` (or `disputeResolution`
      // after the simplify inflector); rename it to plain `resolution` so
      // queries read naturally: `dispute { resolution { winnerAddress } }`.
      //   `foreignFieldName` here = field name on the FOREIGN (Dispute) side
      //   `fieldName`        = field name on the LOCAL (DisputeResolution) side
      "public.DisputeResolution.DisputeResolution_disputeId_fkey": {
        tags: {
          fieldName: "dispute",
          foreignFieldName: "resolution",
        },
      },
    },
  },
});
