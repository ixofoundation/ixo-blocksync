import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import compression from "compression";
import { CronJob } from "cron";
import * as Sentry from "@sentry/node";
import * as EntityHandler from "./handlers/entity_handler";
import * as IpfsHandler from "./handlers/ipfs_handler";
import * as ClaimsHandler from "./handlers/claims_handler";
import * as TokenomicsHandler from "./handlers/tokenomics_handler";
import { SENTRYDSN, TRUST_PROXY } from "./util/secrets";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { web3StorageRateLimiter } from "./util/rate-limiter";
import { Postgraphile } from "./postgraphile";
import swaggerFile from "./swagger.json";
import { getCoreBlock } from "./postgres/blocksync_core/block";

const limiter = rateLimit({
  windowMs: 1 * 1000, // 1 second
  max: 200, // Limit each IP to 100 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 1 second",
});

export const app = express();
app.set("trust proxy", TRUST_PROXY);

Sentry.init({ dsn: SENTRYDSN, tracesSampleRate: 1.0 });
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(compression());
app.use(express.static("public"));
app.use(Sentry.Handlers.requestHandler());
app.use(
  Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      return !!error;
    },
  })
);
app.use(limiter);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(helmet());
app.use(Postgraphile);

app.get("/", (req, res) => {
  res.send("API is Running");
});

// app.get("/ip", (request, response) =>
//   response.send({
//     ips: request.ips,
//     ip: request.ip,
//     protocol: request.protocol,
//     headers: request.headers["x-forwarded-for"],
//   })
// );

app.get("/api/graphql_schema", (request, response) =>
  response.send({
    ips: request.ips,
    ip: request.ip,
    protocol: request.protocol,
    headers: request.headers["x-forwarded-for"],
  })
);

// =================================
// Ipfs
// =================================

app.get("/api/ipfs/:cid", async (req, res, next) => {
  try {
    const doc = await IpfsHandler.getIpfsDocument(req.params.cid);
    if (!doc) throw new Error("Document not found");
    const buf = Buffer.from(doc.data, "base64");
    res.writeHead(200, {
      "Content-Type": doc.contentType,
      "Content-Length": buf.length,
    });
    res.end(buf);
  } catch (error) {
    res.status(404).send(error.message || "Document not found");
  }
});

// =================================
// Claims
// =================================

app.get("/api/claims/collection/:id/claims", async (req, res, next) => {
  try {
    const claims = await ClaimsHandler.getCollectionClaims(
      req.params.id,
      req.query.status as string,
      req.query.type as string,
      req.query.take as string,
      req.query.cursor as string,
      req.query.orderBy as any
    );
    res.json(claims);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// =================================
// Tokenomics
// =================================

let busyFetching = false;
app.get("/api/tokenomics/fetchAccounts", async (req, res, next) => {
  try {
    if (busyFetching) {
      res.status(500).send("Already fetching accounts");
      return;
    }
    busyFetching = true;
    const result = await TokenomicsHandler.getAccountsAndBalances();
    res.json(result);
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    busyFetching = false;
  }
});

// Run getAccountsAndBalances every day to keep it fresh
new CronJob(
  "0 0 0 * * *",
  function () {
    if (!busyFetching) {
      TokenomicsHandler.getAccountsAndBalances();
    }
  },
  null,
  true,
  "Etc/UTC"
);

// =================================
// Custom helpers for local development
// =================================

app.get("/api/development/getCoreBlock/:height", async (req, res, next) => {
  try {
    const result = await getCoreBlock(Number(req.params.height || 0));
    res.json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// =================================
// CRON Jobs
// =================================
// Get entity type "asset/device" with no externalId and check if it has a deviceCredential
// Since ipfs rate limit is 200 per minute, we do 100 every 1 minutes to lessen strain
new CronJob(
  "1 */1 * * * *",
  function () {
    const tokens = web3StorageRateLimiter.getTokensRemaining();
    if (tokens > 110) EntityHandler.getEntitiesExternalId(100, true);
  },
  null,
  true,
  "Etc/UTC"
);

// Get all collections with claims that have no schemaType and then get the schemaType from cellnode
new CronJob(
  "1 */1 * * * *",
  function () {
    ClaimsHandler.getAllClaimTypesFromCellnode();
  },
  null,
  true,
  "Etc/UTC"
);
