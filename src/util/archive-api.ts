import { IXO_ARCHIVE_NODE_REST_API } from "./secrets";
import { sleep } from "./sleep";

// Cache the base URL to avoid checking for trailing slash on every call
let baseUrl: string | null = null;
const getBaseUrl = () => {
  if (!baseUrl) {
    baseUrl = IXO_ARCHIVE_NODE_REST_API;
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }
  }
  return baseUrl;
};

// Archive API response cache
const archiveApiCache = new Map<string, any>();
let currentHeight = 0;

const cleanupOldHeights = (newHeight: number) => {
  if (newHeight <= currentHeight) return;

  // If the new height is higher than the current height for cached responses,
  // we can clear all previous cached responses
  archiveApiCache.clear();
  currentHeight = newHeight;
};

let errorCount = 0;
/**
 * Currently used for: Epochs, DAODAO
 * To query the archive node REST API at a specific height
 */
export const queryArchiveApi = async (path: string, height: number) => {
  // Clean up old heights when moving to a new height
  cleanupOldHeights(height);

  // Check cache first
  const cached = archiveApiCache.get(path);
  if (cached) {
    return cached;
  }

  const url = new URL(path, getBaseUrl());

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "x-cosmos-block-height": height.toString(),
      },
    });
    // console.log("queryArchiveApi response", response);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch from archive node: ${response.statusText} ${response.status}.
        Please ensure the archive node is running and accessible.`
      );
    }
    errorCount = 0; // Reset error count as was successful
    const data = await response.json();

    // Cache the successful response
    archiveApiCache.set(path, data);

    return data;
  } catch (error) {
    console.error("queryArchiveApi error::", error);
    errorCount++;
    if (errorCount > 5) {
      errorCount = 0; // Reset error count as we got auto healing
      throw new Error(
        "Attempted 5 backoff retries (1.1s each) to query archive node, but still failed. Please check the archive node and it's rate limiting"
      );
    }
    // Add backoff retry incase it was temporary network issue or rate limiting
    await sleep(1100);
    return queryArchiveApi(path, height);
  }
};
