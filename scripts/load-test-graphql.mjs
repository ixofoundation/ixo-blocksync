#!/usr/bin/env node
// Standalone load tester for the blocksync GraphQL endpoint.
// Designed to reproduce the pg-pool exhaustion / ECONNREFUSED issue
// (see https://github.com/ixofoundation/ixo-blocksync/issues — pool max=30
// in src/postgraphile.ts and src/postgres/client.ts).
//
// Run before AND after switching the DATABASE_URL to pgBouncer on devnet
// to confirm the fix: with pgBouncer, excess requests should queue and
// drain rather than time out with "Connection terminated due to connection
// timeout" and crash the pod.
//
// Requires Node >= 18 (uses native fetch + AbortController). No deps.
//
// Examples:
//   node scripts/load-test-graphql.mjs
//   node scripts/load-test-graphql.mjs --concurrency 120 --duration 90
//   node scripts/load-test-graphql.mjs --url https://blocksync-graphql.ixo.earth/graphql
//   node scripts/load-test-graphql.mjs --concurrency 200 --duration 30 --timeout 8000

const DEFAULTS = {
  url: "https://devnet-blocksync-graphql.ixo.earth/graphql",
  concurrency: 60,   // > pool max of 30 → forces queueing / timeouts pre-pgBouncer
  duration: 60,      // seconds
  timeout: 15000,    // per-request, ms (above postgraphile's 4s statement_timeout)
  reportEvery: 5,    // seconds
  rps: 150,          // app rate-limit is 200/s per IP → stay under to avoid 429
};

function parseArgs(argv) {
  const opts = { ...DEFAULTS };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    switch (k) {
      case "--url": opts.url = v; i++; break;
      case "--concurrency": opts.concurrency = Number(v); i++; break;
      case "--duration": opts.duration = Number(v); i++; break;
      case "--timeout": opts.timeout = Number(v); i++; break;
      case "--report-every": opts.reportEvery = Number(v); i++; break;
      case "--rps": opts.rps = Number(v); i++; break;
      case "-h":
      case "--help":
        console.log(`Usage: node load-test-graphql.mjs [options]

  --url <url>             GraphQL endpoint (default: ${DEFAULTS.url})
  --concurrency <n>       In-flight workers (default: ${DEFAULTS.concurrency})
  --duration <seconds>    Test duration (default: ${DEFAULTS.duration})
  --timeout <ms>          Per-request timeout (default: ${DEFAULTS.timeout})
  --report-every <s>      Progress report interval (default: ${DEFAULTS.reportEvery})
  --rps <n>               Global request cap, set 0 to disable (default: ${DEFAULTS.rps})
                          The app rate-limits at 200/s per IP, so default stays under.
`);
        process.exit(0);
    }
  }
  return opts;
}

// Query bank: weighted mix of cheap (simulate normal traffic) and heavy
// (simulate the bot/script traffic that exhausts the pool). Heavy queries
// hold a pool slot for hundreds of ms via joins + filters + large `first`,
// which is what actually saturates the 30-slot pool.
const QUERIES = [
  // ---- cheap (weight 1) ----
  {
    name: "chains_light",
    weight: 1,
    body: `{ chains(first: 5) { nodes { chainId blockHeight } } }`,
  },
  {
    name: "transactions_recent",
    weight: 1,
    body: `{ transactions(first: 50, orderBy: HEIGHT_DESC) {
      nodes { hash height code time gasUsed gasWanted feePayer }
    } }`,
  },
  // ---- heavy (weight 4) — these hold pool slots much longer ----
  {
    name: "transactions_with_messages",
    weight: 4,
    body: `{ transactions(first: 100, orderBy: HEIGHT_DESC) {
      nodes {
        hash height code time fee
        messagesByTransactionHash(first: 10) {
          nodes { typeUrl from to denoms tokenNames }
        }
      }
    } }`,
  },
  {
    name: "entities_deep_join",
    weight: 4,
    body: `{ entities(first: 100) {
      totalCount
      nodes {
        id type status owner accounts metadata
        iidById { id verificationMethod service linkedResource }
        tokensByCollection(first: 5) { nodes { id name index } }
      }
    } }`,
  },
  {
    name: "transactions_total_count",
    weight: 3,
    body: `{ transactions(filter: { code: { equalTo: 0 } }) { totalCount } }`,
  },
  {
    name: "messages_filtered",
    weight: 3,
    body: `{ messages(first: 100, filter: { typeUrl: { includes: "MsgExec" } }, orderBy: ID_DESC) {
      nodes { id typeUrl from to transactionHash }
    } }`,
  },
  {
    name: "iids_json_scan",
    weight: 3,
    body: `{ iids(first: 50) {
      nodes { id controller verificationMethod service linkedResource linkedClaim linkedEntity metadata }
    } }`,
  },
];

const WEIGHTED_BAG = QUERIES.flatMap((q) => Array(q.weight).fill(q));
function pickQuery() {
  return WEIGHTED_BAG[Math.floor(Math.random() * WEIGHTED_BAG.length)];
}

// Token-bucket RPS governor. capacity = rps (1-second burst), refill smoothly.
class RpsGovernor {
  constructor(rps) {
    this.rps = rps;
    this.tokens = rps;
    this.last = performance.now();
    this.waiters = [];
  }
  _refill() {
    const now = performance.now();
    const dt = (now - this.last) / 1000;
    this.last = now;
    this.tokens = Math.min(this.rps, this.tokens + dt * this.rps);
    while (this.tokens >= 1 && this.waiters.length) {
      this.tokens -= 1;
      this.waiters.shift()();
    }
  }
  async acquire() {
    if (this.rps <= 0) return;
    this._refill();
    if (this.tokens >= 1) { this.tokens -= 1; return; }
    return new Promise((resolve) => {
      this.waiters.push(resolve);
      // Wake periodically to refill while waiters exist.
      if (!this._timer) {
        this._timer = setInterval(() => {
          this._refill();
          if (this.waiters.length === 0) {
            clearInterval(this._timer);
            this._timer = null;
          }
        }, 10);
      }
    });
  }
}

// 429s are app-level rate limiting, not pool problems — track separately so
// they don't pollute the "real failure" signal.
function isRateLimit(tag) { return tag === "HTTP_429"; }

class Stats {
  constructor() {
    this.success = 0;
    this.fail = 0;          // real failures only (excludes 429)
    this.rateLimited = 0;
    this.latencies = [];    // ms, successes only
    this.errors = new Map();
    this.perQuery = new Map(); // name -> { ok, fail, rl, latSum, latN }
  }
  _perQ(name) {
    let q = this.perQuery.get(name);
    if (!q) { q = { ok: 0, fail: 0, rl: 0, latSum: 0, latN: 0 }; this.perQuery.set(name, q); }
    return q;
  }
  recordSuccess(queryName, ms) {
    this.success++;
    this.latencies.push(ms);
    const q = this._perQ(queryName);
    q.ok++; q.latSum += ms; q.latN++;
  }
  recordFailure(queryName, tag) {
    if (isRateLimit(tag)) {
      this.rateLimited++;
      this._perQ(queryName).rl++;
    } else {
      this.fail++;
      this._perQ(queryName).fail++;
    }
    this.errors.set(tag, (this.errors.get(tag) || 0) + 1);
  }
  snapshot() {
    return { success: this.success, fail: this.fail, rateLimited: this.rateLimited };
  }
}

function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor((p / 100) * sortedAsc.length));
  return sortedAsc[idx];
}

function classifyError(err) {
  const code = err?.cause?.code || err?.code;
  if (code) return code;                                  // ECONNREFUSED, ECONNRESET, ETIMEDOUT, ENOTFOUND, ...
  if (err?.name === "AbortError") return "CLIENT_TIMEOUT";
  if (typeof err?.message === "string") {
    if (err.message.includes("fetch failed")) return "FETCH_FAILED";
    return err.message.slice(0, 80);
  }
  return "UNKNOWN";
}

async function doRequest(url, query, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const started = performance.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "accept": "application/json" },
      body: JSON.stringify({ query: query.body }),
      signal: ctrl.signal,
    });
    const ms = performance.now() - started;
    if (!res.ok) {
      // Drain body so the socket can be reused.
      await res.text().catch(() => {});
      return { ok: false, ms, tag: `HTTP_${res.status}` };
    }
    const json = await res.json();
    if (json.errors && json.errors.length) {
      // GraphQL-level error (e.g. statement_timeout) — still a server-side fault.
      const msg = json.errors[0]?.message || "GRAPHQL_ERROR";
      return { ok: false, ms, tag: `GQL:${msg.slice(0, 60)}` };
    }
    return { ok: true, ms };
  } catch (err) {
    const ms = performance.now() - started;
    return { ok: false, ms, tag: classifyError(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function worker(deadline, opts, stats, governor) {
  while (performance.now() < deadline) {
    await governor.acquire();
    if (performance.now() >= deadline) break;
    const q = pickQuery();
    const r = await doRequest(opts.url, q, opts.timeout);
    if (r.ok) stats.recordSuccess(q.name, r.ms);
    else stats.recordFailure(q.name, r.tag);
  }
}

function fmtTopErrors(errMap, n = 6) {
  return [...errMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `${k}=${v}`)
    .join("  ");
}

async function main() {
  const opts = parseArgs(process.argv);
  const stats = new Stats();

  console.log(`[load-test] target  : ${opts.url}`);
  console.log(`[load-test] workers : ${opts.concurrency}`);
  console.log(`[load-test] duration: ${opts.duration}s`);
  console.log(`[load-test] timeout : ${opts.timeout}ms`);
  console.log(`[load-test] rps cap : ${opts.rps > 0 ? opts.rps + "/s" : "unlimited"}`);
  console.log(`[load-test] queries : ${QUERIES.map((q) => `${q.name}(w${q.weight})`).join(", ")}`);
  console.log();

  const governor = new RpsGovernor(opts.rps);
  const deadline = performance.now() + opts.duration * 1000;
  let last = stats.snapshot();
  const reporter = setInterval(() => {
    const now = stats.snapshot();
    const dOk = now.success - last.success;
    const dFail = now.fail - last.fail;
    const dRl = now.rateLimited - last.rateLimited;
    last = now;
    const rps = ((dOk + dFail + dRl) / opts.reportEvery).toFixed(1);
    const errSummary = stats.errors.size ? `  errors: ${fmtTopErrors(stats.errors)}` : "";
    console.log(
      `[t+${(((opts.duration * 1000) - (deadline - performance.now())) / 1000).toFixed(0)}s]` +
      ` ok=${now.success} fail=${now.fail} 429=${now.rateLimited} rps=${rps}${errSummary}`
    );
  }, opts.reportEvery * 1000);

  const workers = Array.from({ length: opts.concurrency }, () =>
    worker(deadline, opts, stats, governor)
  );
  await Promise.all(workers);
  clearInterval(reporter);

  const sorted = [...stats.latencies].sort((a, b) => a - b);
  const total = stats.success + stats.fail + stats.rateLimited;
  console.log();
  console.log("==================== Summary ====================");
  console.log(`total requests   : ${total}`);
  console.log(`success          : ${stats.success} (${total ? ((stats.success / total) * 100).toFixed(2) : 0}%)`);
  console.log(`real failures    : ${stats.fail} (${total ? ((stats.fail / total) * 100).toFixed(2) : 0}%)`);
  console.log(`rate-limited 429 : ${stats.rateLimited} (${total ? ((stats.rateLimited / total) * 100).toFixed(2) : 0}%)`);
  console.log(`throughput       : ${(total / opts.duration).toFixed(1)} req/s`);
  console.log();
  console.log("latency (successful requests, ms):");
  console.log(`  min  : ${sorted[0]?.toFixed(0) ?? "-"}`);
  console.log(`  p50  : ${percentile(sorted, 50).toFixed(0)}`);
  console.log(`  p95  : ${percentile(sorted, 95).toFixed(0)}`);
  console.log(`  p99  : ${percentile(sorted, 99).toFixed(0)}`);
  console.log(`  max  : ${sorted[sorted.length - 1]?.toFixed(0) ?? "-"}`);
  console.log();
  if (stats.errors.size) {
    console.log("error breakdown:");
    [...stats.errors.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`  ${k.padEnd(40)} ${v}`));
    console.log();
  }
  console.log("per-query (avg latency on success):");
  [...stats.perQuery.entries()]
    .sort((a, b) => (b[1].ok + b[1].fail + b[1].rl) - (a[1].ok + a[1].fail + a[1].rl))
    .forEach(([name, { ok, fail, rl, latSum, latN }]) => {
      const avg = latN ? (latSum / latN).toFixed(0) : "-";
      console.log(`  ${name.padEnd(28)} ok=${String(ok).padEnd(5)} fail=${String(fail).padEnd(5)} 429=${String(rl).padEnd(5)} avg=${avg}ms`);
    });

  // Exit 1 only on real failures (429 doesn't count).
  process.exit(stats.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("[load-test] fatal:", e);
  process.exit(2);
});
