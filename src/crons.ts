import { CronJob } from "cron";
import * as EntityHandler from "./handlers/entity_handler";
import * as ClaimsHandler from "./handlers/claims_handler";
import * as TokenomicsHandler from "./handlers/tokenomics_handler";
import { web3StorageRateLimiter } from "./util/rate-limiter";
import { expireAuthzGrants } from "./postgres/authz";
import { getChain } from "./postgres/chain";
import { getCoreChain } from "./postgres/blocksync_core/chain";
import { currentChain } from "./sync/sync_chain";

// Write-side jobs that belong to the indexer (ixo-blocksync-api is read-only
// and relies on these keeping the tables fresh).
export const startCrons = (): void => {
  // Refresh tokenomics accounts and balances daily
  let busyFetching = false;
  new CronJob(
    "0 0 0 * * *",
    async function () {
      if (busyFetching) return;
      busyFetching = true;
      try {
        await TokenomicsHandler.getAccountsAndBalances();
      } finally {
        busyFetching = false;
      }
    },
    null,
    true,
    "Etc/UTC"
  );

  // Get entity type "asset/device" with no externalId and check if it has a
  // deviceCredential. Ipfs rate limit is 200 per minute, so do 100 every
  // minute to lessen strain.
  new CronJob(
    "1 */1 * * * *",
    function () {
      const tokens = web3StorageRateLimiter.getTokensRemaining();
      if (tokens > 110) EntityHandler.getEntitiesExternalId(100);
    },
    null,
    true,
    "Etc/UTC"
  );

  // Get all collections with claims that have no schemaType and then get the
  // schemaType from cellnode
  new CronJob(
    "1 */1 * * * *",
    function () {
      ClaimsHandler.getAllClaimTypesFromCellnode();
    },
    null,
    true,
    "Etc/UTC"
  );

  // Flip wall-clock-expired authz grants (expiry is passive on-chain — grants
  // are pruned without any message or event). Query-time correctness already
  // comes from the authz_grant_effective_status computed field; this just
  // converges the stored status. Gated on sync being caught up so a
  // historical resync doesn't expire rows that a later block's hydration
  // would legitimately update.
  let busyExpiring = false;
  new CronJob(
    "0 */10 * * * *",
    async function () {
      if (busyExpiring) return;
      busyExpiring = true;
      try {
        // Gauge caught-up-ness against the core DB head (not RPC — the query
        // client is not initialised when STATIC_CHAIN_ID is used).
        const [chain, coreChain] = await Promise.all([
          getChain(currentChain.chainId),
          getCoreChain(currentChain.chainId),
        ]);
        if (!chain || !coreChain || coreChain.blockHeight - chain.blockHeight > 100)
          return;
        const expired = await expireAuthzGrants();
        if (expired > 0) console.log(`Expired ${expired} authz grants`);
      } catch (error) {
        console.error("authz expiry cron: ", error.message);
      } finally {
        busyExpiring = false;
      }
    },
    null,
    true,
    "Etc/UTC"
  );
};
