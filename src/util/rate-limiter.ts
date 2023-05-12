import throttledQueue from "throttled-queue";

const WEB3_RATE_LIMIT_REQUESTS = 200;
const WEB3_RATE_LIMIT_PERIOD = 1000 * 60;

export function createWeb3SRateLimiter() {
  const throttle = throttledQueue(
    WEB3_RATE_LIMIT_REQUESTS,
    WEB3_RATE_LIMIT_PERIOD
  );
  return () => throttle(() => {});
}
