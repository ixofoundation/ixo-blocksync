import { CronJob } from "cron";
import * as EntityHandler from "./handlers/entity_handler";
import * as ClaimsHandler from "./handlers/claims_handler";
import * as TokenomicsHandler from "./handlers/tokenomics_handler";
import { web3StorageRateLimiter } from "./util/rate-limiter";

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
};
