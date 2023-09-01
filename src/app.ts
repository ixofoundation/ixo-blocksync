import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import compression from "compression";
import { CronJob } from "cron";
import * as Sentry from "@sentry/node";
import * as EntityHandler from "./handlers/entity_handler";
import * as IpfsHandler from "./handlers/ipfs_handler";
import * as ClaimsHandler from "./handlers/claims_handler";
import { SENTRYDSN, TRUST_PROXY } from "./util/secrets";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { web3StorageRateLimiter } from "./util/rate-limiter";
import { Postgraphile } from "./postgraphile";

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 1 minutes",
});

const swaggerFile = require(`${__dirname}/../../swagger.json`);

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
    next(error);
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

// TODO add graphql to cellnode so we dont cause memory heaps is queries take too long
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
