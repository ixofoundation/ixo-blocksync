import express from "express";
import rateLimit from "express-rate-limit";
import { pool } from "./postgres/client";
import { TRUST_PROXY } from "./util/secrets";

// ixo-blocksync is indexer-only: all query traffic (GraphQL + REST) is served
// by ixo-blocksync-api from the same database. The only public surface here
// is liveness/health so monitoring can verify the indexer is alive and
// making progress.
export const app = express();

// Rate-limit the public health endpoints. k8s probes hit the pod directly
// (their own source IP bucket), so they are unaffected.
app.set("trust proxy", TRUST_PROXY);
app.use(
  rateLimit({
    windowMs: 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 1 second",
  })
);

// k8s liveness/readiness probes hit "/"
app.get("/", (_req, res) => {
  res.send("Indexer is Running");
});

// Health with a DB round-trip + the latest indexed height, so external
// monitoring can also verify the indexer is progressing (poll twice and
// compare heights).
app.get("/healthz", async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT "chainId", "blockHeight" FROM "Chain" ORDER BY "blockHeight" DESC LIMIT 1'
    );
    res.json({ ok: true, chain: result.rows[0] ?? null });
  } catch (error: any) {
    res.status(503).json({ ok: false, error: error.message });
  }
});
