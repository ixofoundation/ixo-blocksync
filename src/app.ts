import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import compression from "compression";
import { CronJob } from "cron";
import * as Sentry from "@sentry/node";
import * as EntityHandler from "./handlers/entity_handler";
import * as IpfsHandler from "./handlers/ipfs_handler";
import * as TokenHandler from "./handlers/token_handler";
import * as ClaimsHandler from "./handlers/claims_handler";
import { SENTRYDSN, TRUST_PROXY } from "./util/secrets";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { web3StorageRateLimiter } from "./util/rate-limiter";
import { Postgraphile } from "./postgraphile";

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 50000, // Limit each IP to 100 requests per `window`
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
// Entity
// =================================

app.get("/api/entity/byId/:id", async (req, res, next) => {
  try {
    const doc = await EntityHandler.getEntityById(req.params.id);
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

app.get("/api/entity/byExternalId/:id", async (req, res, next) => {
  try {
    const doc = await EntityHandler.getEntityByExternalId(req.params.id);
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

app.get("/api/entity/all", async (req, res, next) => {
  try {
    const entities = await EntityHandler.getEntitiesByType();
    res.json(entities);
  } catch (error) {
    next(error);
  }
});

app.get("/api/entity/byType/:type", async (req, res, next) => {
  try {
    const entities = await EntityHandler.getEntitiesByType(req.params.type);
    res.json(entities);
  } catch (error) {
    next(error);
  }
});

app.get("/api/entity/byOwnerAddress/:address", async (req, res, next) => {
  try {
    const entities = await EntityHandler.getEntitiesByOwnerAddress(
      req.params.address
    );
    res.json(entities);
  } catch (error) {
    next(error);
  }
});

app.get("/api/entity/byOwnerDid/:did", async (req, res, next) => {
  try {
    const entities = await EntityHandler.getEntitiesByOwnerDid(req.params.did);
    res.json(entities);
  } catch (error) {
    next(error);
  }
});

app.get("/api/entity/collections", async (req, res, next) => {
  try {
    const entities = await EntityHandler.getEntityCollections();
    res.json(entities);
  } catch (error) {
    next(error);
  }
});

app.get("/api/entity/collectionById/:id", async (req, res, next) => {
  try {
    const entities = await EntityHandler.getEntityCollectionById(req.params.id);
    res.json(entities);
  } catch (error) {
    next(error);
  }
});

app.get(
  "/api/entity/collectionsByOwnerAddress/:address",
  async (req, res, next) => {
    try {
      const entities = await EntityHandler.getEntityCollectionsByOwnerAddress(
        req.params.address
      );
      res.json(entities);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/entity/collectionsByOwnerDid/:did", async (req, res, next) => {
  try {
    const entities = await EntityHandler.getEntityCollectionsByOwnerDid(
      req.params.did
    );
    res.json(entities);
  } catch (error) {
    next(error);
  }
});

app.get("/api/entity/owner/:id", async (req, res, next) => {
  try {
    const owner = await EntityHandler.getEntityOwner(req.params.id);
    res.json({ owner });
  } catch (error) {
    next(error);
  }
});

// app.get("/api/entity/tokens/:id", async (req, res, next) => {
//   try {
//     const balances = await getEntityTokens(req.params.id);
//     res.json(balances);
//   } catch (error) {
//     next(error);
//   }
// });

app.get(
  "/api/app/entity/collectionsAndEntityCountByOwnerAddress/:address",
  async (req, res, next) => {
    try {
      const entities =
        await EntityHandler.getEntityCollectionsAndEntityCountByOwnerAddress(
          req.params.address
        );
      res.json(entities);
    } catch (error) {
      next(error);
    }
  }
);

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
    next(error);
  }
});

// =================================
// Token
// =================================

app.get("/api/token/byAddress/:address", async (req, res, next) => {
  try {
    const tokens = await TokenHandler.getAccountTokens(
      req.params.address,
      (req.query?.name || "") as string
    );
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

app.get("/api/token/totalByAddress/:address", async (req, res, next) => {
  try {
    const tokens = await TokenHandler.getTokensTotalByAddress(
      req.params.address,
      (req.query?.name || "") as string
    );
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

app.get("/api/token/totalForEntities/:address", async (req, res, next) => {
  try {
    const tokens = await TokenHandler.getTokensTotalForEntities(
      req.params.address,
      (req.query?.name || "") as string
    );
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

app.get("/api/token/totalForCollection/:did", async (req, res, next) => {
  try {
    const tokens = await TokenHandler.getTokensTotalForCollection(
      req.params.did,
      (req.query?.name || "") as string
    );
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

app.get(
  "/api/token/totalForCollection/:did/amounts",
  async (req, res, next) => {
    try {
      const tokens = await TokenHandler.getTokensTotalForCollectionAmounts(
        req.params.did,
        (req.query?.name || "") as string
      );
      res.json(tokens);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/app/token/amountByAddress/:address", async (req, res, next) => {
  try {
    const tokens = await TokenHandler.getTokensTotalAmountByAddress(
      req.params.address,
      (req.query?.name || "") as string
    );
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

app.get("/api/app/token/mintedByAddress/:address", async (req, res, next) => {
  try {
    const tokens = await TokenHandler.getTokensTotalMintedByAddress(
      req.params.address,
      (req.query?.name || "") as string
    );
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

app.get("/api/app/token/retiredByAddress/:address", async (req, res, next) => {
  try {
    const tokens = await TokenHandler.getTokensTotalRetiredByAddress(
      req.params.address,
      (req.query?.name || "") as string
    );
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

// app.get("/api/token/retired/:name/:id", async (req, res, next) => {
//   try {
//     const token = await TokenHandler.getTokenRetiredAmount(
//       req.params.name,
//       req.params.id
//     );
//     res.json(token);
//   } catch (error) {
//     next(error);
//   }
// });

// =================================
// Bonds
// =================================

// app.get("/api/bonds/getAccountBonds/:account", async (req, res, next) => {
//   try {
//     const bonds = await ProtoHandler.getAccountBonds(req.params.account);
//     res.json(bonds);
//   } catch (error) {
//     next(error);
//   }
// });

// =================================
// CRON Jobs
// =================================
// Get antity type "asset/device" with no externalId and check if it has a deviceCredential
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
