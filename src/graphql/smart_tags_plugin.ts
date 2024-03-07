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
  },
});
