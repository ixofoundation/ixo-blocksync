import { RateLimiter } from "limiter";

export const web3StorageRateLimiter = new RateLimiter({
  tokensPerInterval: 200,
  interval: 1000 * 60,
});
