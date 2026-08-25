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

// Archive API response cache, scoped to a single block height. Each new
// height invalidates the whole cache — the archive node's view at a given
// height is immutable so any value we get for path+height is good to
// re-serve until we move on.
const archiveApiCache = new Map<string, any>();
let currentHeight = 0;

const cleanupOldHeights = (newHeight: number) => {
  if (newHeight <= currentHeight) return;
  archiveApiCache.clear();
  currentHeight = newHeight;
};

// Backoff schedule for retriable archive errors (rate-limit / 5xx /
// network). Three attempts at increasing waits, then bail.
//
// We deliberately keep the schedule short and bounded — long-running
// retries inside the per-block transaction would hold the postgres
// connection open and stall the indexer; better to surface the failure
// and let the outer sync loop's own error-recovery retry the whole block.
const RETRY_BACKOFFS_MS = [1100, 2100, 3100];

// Errors with these HTTP statuses are worth retrying. Other 4xx errors
// (e.g. 400 bad request, 404 not found) are deterministic and we should
// surface them immediately.
const isRetriableStatus = (status: number): boolean => {
  // 429 Too Many Requests — explicit rate limit
  if (status === 429) return true;
  // 502/503/504 — gateway/upstream issues, almost always transient
  if (status === 502 || status === 503 || status === 504) return true;
  // 500 is ambiguous: see isRetriable500Body — only retry on bare 500
  // (no chain-emitted gRPC error envelope). Caller handles that path.
  return false;
};

// Cosmos REST gateways wrap deterministic gRPC errors in a JSON envelope:
//   { "code": <int>, "message": "...", "details": [...] }
// served with HTTP 500. Examples:
//   - { "code": 2, "message": "codespace undefined code 111222: panic" }
//     (pre-cutoff cosmwasm smart-query, will never succeed at this height)
//   - { "code": 2, "message": "codespace wasm code 22: no such contract" }
//     (contract address doesn't exist at this height)
//   - { "code": 2, "message": "codespace sdk code 18: failed to load state"
//     (pruning — node doesn't have this height anymore)
// These are *deterministic* — retrying won't help. A bare 500 with no
// JSON envelope (or one without a code field) is a real server fault
// and SHOULD be retried.
const isRetriable500Body = (body: any): boolean => {
  if (body == null || typeof body !== "object") return true; // unknown shape → retry
  if (typeof body.code === "number" && typeof body.message === "string") {
    return false; // deterministic gRPC-style error → don't retry
  }
  return true;
};

/**
 * Query the archive node REST API at a specific block height.
 *
 * Retry policy:
 *   - HTTP 429 / 5xx / network errors → retry per RETRY_BACKOFFS_MS.
 *   - HTTP 4xx (other than 429) → fail fast, the request will never succeed.
 *   - After exhausting RETRY_BACKOFFS_MS, throw so the caller (typically a
 *     block-processing transaction) can abort cleanly.
 *
 * Currently used for: Epochs, DAODAO, v7-snapshot (liquidstake + claims).
 */
export const queryArchiveApi = async (
  path: string,
  height: number,
  opts?: { bypassCache?: boolean },
): Promise<any> => {
  // bypassCache: neither reads nor writes the height-scoped cache, and does
  // not advance its height watermark. Needed by callers that query AHEAD of
  // the block being processed (authz pruned-height snapping) — advancing the
  // watermark early would let entries cached at the future height be served
  // to same-path queries at earlier heights.
  if (!opts?.bypassCache) {
    cleanupOldHeights(height);
    const cached = archiveApiCache.get(path);
    if (cached !== undefined) return cached;
  }

  const url = new URL(path, getBaseUrl()).toString();

  // attempt 0 is the first try; attempt 1..3 are retries.
  for (let attempt = 0; attempt <= RETRY_BACKOFFS_MS.length; attempt++) {
    try {
      // Hard timeout: a keep-alive connection that goes half-dead otherwise
      // hangs this fetch FOREVER (observed against the mainnet archive) —
      // the indexer then freezes silently with no error and no retry. A
      // timeout rejection falls into the retriable-network-error path below.
      const response = await fetch(url, {
        headers: { "x-cosmos-block-height": height.toString() },
        signal: AbortSignal.timeout(30_000),
      });

      if (response.ok) {
        const data = await response.json();
        if (!opts?.bypassCache) archiveApiCache.set(path, data);
        return data;
      }

      // Try to parse the body so we can both surface a useful message
      // AND distinguish a "real" 500 from a chain-emitted gRPC-style
      // error envelope.
      let body: any = null;
      try {
        body = await response.json();
      } catch {
        /* body may be empty or non-JSON for some gateway-level failures */
      }
      const bodyMsg =
        body && typeof body.message === "string"
          ? `[code=${body.code}] ${body.message}`
          : response.statusText;

      // Status-class based retry decision (429, 502, 503, 504).
      let retriable = isRetriableStatus(response.status);

      // 500 needs body inspection — deterministic gRPC errors come back
      // wrapped in a {code,message,details} envelope and must NOT be
      // retried (panic / no such contract / pruned height etc).
      if (response.status === 500) {
        retriable = isRetriable500Body(body);
      }

      if (!retriable) {
        throw new Error(
          `archive query non-retriable: HTTP ${response.status} ${bodyMsg} ${path}@${height}`,
        );
      }

      // Retriable. If we've used all our retries, give up.
      if (attempt === RETRY_BACKOFFS_MS.length) {
        throw new Error(
          `archive query failed after ${RETRY_BACKOFFS_MS.length} retries ` +
            `(last: HTTP ${response.status} ${bodyMsg}) ${path}@${height}`,
        );
      }

      const delay = RETRY_BACKOFFS_MS[attempt];
      console.warn(
        `[archive-api] HTTP ${response.status} on ${path}@${height} — ` +
          `retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_BACKOFFS_MS.length})`,
      );
      await sleep(delay);
      continue;
    } catch (err: any) {
      // Network error or thrown above. If it's a non-retriable thrown
      // error from the branch above, rethrow immediately — no retry,
      // no backoff.
      const msg = err?.message ?? String(err);
      if (msg.startsWith("archive query non-retriable")) throw err;

      // Otherwise treat as a retriable network failure (DNS, TCP reset,
      // TLS handshake, fetch timeout, etc — anything that didn't reach
      // a successful response).
      if (attempt === RETRY_BACKOFFS_MS.length) {
        throw new Error(
          `archive query failed after ${RETRY_BACKOFFS_MS.length} retries ` +
            `(last error: ${msg}) ${path}@${height}`,
        );
      }
      const delay = RETRY_BACKOFFS_MS[attempt];
      console.warn(
        `[archive-api] network error on ${path}@${height}: ${msg} — ` +
          `retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_BACKOFFS_MS.length})`,
      );
      await sleep(delay);
      continue;
    }
  }

  // Unreachable — the loop either returns or throws.
  throw new Error(
    `archive query unreachable code reached for ${path}@${height}`,
  );
};

// A deterministic contract-state deserialization failure: the contract's
// stored state cannot be parsed by the code that was live at the queried
// height (e.g. a proposal module in-place-migrated to a version whose schema
// added a required field with no serde default). Such a query fails
// identically at that height FOREVER — retrying or crash-restarting can never
// index it. Deliberately narrow: all three markers must be present, so
// network errors, fetch timeouts, exhausted retries ("archive query failed
// after"), pruned heights, "no such contract" and contract panics do NOT
// match and keep aborting the block as before.
export const isDeterministicWasmParseError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("archive query non-retriable") &&
    msg.includes("query wasm contract failed") &&
    msg.includes("Error parsing into type")
  );
};
