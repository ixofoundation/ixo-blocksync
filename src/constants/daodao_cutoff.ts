import { NETWORK } from "../util/secrets";

/**
 * First block height per network at which cosmwasm smart-queries succeed.
 *
 * Below this height the archive node responds with
 *   { "code": 2, "message": "codespace undefined code 111222: panic" }
 * for any `/cosmwasm/wasm/v1/contract/{addr}/smart/{q}` call — the wasm VM
 * can't execute against the pre-upgrade state shape. Contract metadata
 * (`/contract/{addr}`, `/code/{id}`) and raw KV (`/contract/{addr}/state`)
 * still work, but every daodao indexer call goes through smart-queries.
 *
 * The cutoffs were found by binary-searching `dump_state` against a
 * long-lived dao-core contract on each network — the boundary is sharp
 * to within a single block on all three chains, and corresponds to a
 * chain upgrade (consensus_hash changes one block later, ~5s gap).
 *
 * - devnet:  upgrade @ 2024-11-29 07:17:31 UTC
 * - testnet: upgrade in the same family
 * - mainnet: upgrade in the same family
 *
 * Behaviour:
 * - For blocks BELOW the cutoff, the daodao event handlers no-op so the
 *   indexer survives without panicking.
 * - On the first block AT/ABOVE the cutoff we run a one-shot snapshot
 *   that walks every dao-core address registered in `wasm_instantiate`
 *   and rebuilds the daodao tables from chain state.
 * - From the cutoff onward, normal event-driven indexing resumes.
 */
export const DAODAO_CUTOFF_HEIGHTS: Record<string, number> = {
  devnet: 5_251_750,
  testnet: 9_284_120,
  mainnet: 9_269_290,
};

// Optional env override. Useful in two cases:
//   - Local integration tests against a freshly-bootstrapped chain with
//     chain_id="devnet-1" but no upgrade history: set to 0 to disable.
//   - Operator wants to push the cutoff later (e.g. after a follow-on
//     upgrade we haven't hard-coded yet).
// Set to a number (the new cutoff) or to 0 to disable the cutoff guard.
const overrideRaw = process.env.DAODAO_CUTOFF_HEIGHT;
const overrideParsed = overrideRaw !== undefined ? Number(overrideRaw) : NaN;

export const DAODAO_CUTOFF_HEIGHT: number = Number.isFinite(overrideParsed)
  ? overrideParsed
  : (DAODAO_CUTOFF_HEIGHTS[NETWORK] ?? 0);

/**
 * True iff the given block height is at or past the cutoff for the current
 * network. Used as a guard at the entry to every daodao event handler.
 *
 * Returns true when the cutoff is unset (0) — that case is reserved for
 * unrecognised networks where we'd rather attempt the query and let the
 * archive node tell us if it's not serviceable.
 */
export const isDaodaoIndexable = (blockHeight: number): boolean =>
  DAODAO_CUTOFF_HEIGHT === 0 || blockHeight >= DAODAO_CUTOFF_HEIGHT;
