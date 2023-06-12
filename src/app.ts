import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import compression from "compression";
import { CronJob } from "cron";
import * as Sentry from "@sentry/node";
import postgraphile from "postgraphile";
import * as IidHandler from "./handlers/iid_handler";
import * as EntityHandler from "./handlers/entity_handler";
import * as IpfsHandler from "./handlers/ipfs_handler";
import * as TokenHandler from "./handlers/token_handler";
import * as ClaimsHandler from "./handlers/claims_handler";
import * as StatHandler from "./handlers/stats_handler";
import * as EventHandler from "./handlers/event_handler";
import * as BondHandler from "./handlers/bond_handler";
import * as TransactionHandler from "./handlers/transaction_handler";
import * as BlockHandler from "./handlers/block_handler";
import * as ProtoHandler from "./util/proto";
import { SENTRYDSN, DATABASE_URL, TRUST_PROXY } from "./util/secrets";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { web3StorageRateLimiter } from "./util/rate-limiter";

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
app.use(Sentry.Handlers.requestHandler());
app.use(
  Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      return !!error;
    },
  })
);
app.use(
  postgraphile(DATABASE_URL, "public", {
    watchPg: true,
    graphiql: true,
    enhanceGraphiql: true,
    dynamicJson: true,
    disableDefaultMutations: true,
  })
);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(helmet());
app.use(limiter);

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

app.get("/api/entity/lasttransferred/:id", async (req, res, next) => {
  try {
    const lastTransferred = await EntityHandler.getEntityLastTransferredDate(
      req.params.id
    );
    res.json({ lastTransferred });
  } catch (error) {
    next(error);
  }
});

// =================================
// Claims
// =================================

app.get("/api/claims/collection/:id", async (req, res, next) => {
  try {
    const collection = await ClaimsHandler.getCollectionById(req.params.id);
    res.json(collection);
  } catch (error) {
    next(error);
  }
});

app.get("/api/claims/collection/:id/claims", async (req, res, next) => {
  try {
    const claims = await ClaimsHandler.getCollectionClaims(
      req.params.id,
      req.query.status as string,
      req.query.type as string,
      req.query.take as string
    );
    res.json(claims);
  } catch (error) {
    next(error);
  }
});

app.get("/api/claims/claim/:id", async (req, res, next) => {
  try {
    const claim = await ClaimsHandler.getClaimById(req.params.id);
    res.json(claim);
  } catch (error) {
    next(error);
  }
});

// =================================
// Token
// =================================

app.get(
  "/api/tokenclass/contractaddress/:contractAddress",
  async (req, res, next) => {
    try {
      const tokenClass = await TokenHandler.getTokenClassByContractAddress(
        req.params.contractAddress
      );
      res.json(tokenClass);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/tokenclass/name/:name", async (req, res, next) => {
  try {
    const tokenClass = await TokenHandler.getTokenClassByName(req.params.name);
    res.json(tokenClass);
  } catch (error) {
    next(error);
  }
});

app.get("/api/tokenclass/class/:id", async (req, res, next) => {
  try {
    const tokenClasses = await TokenHandler.getTokenClassesByClass(
      req.params.id
    );
    res.json(tokenClasses);
  } catch (error) {
    next(error);
  }
});

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

app.get("/api/token/retired/:address", async (req, res, next) => {
  try {
    const tokens = await TokenHandler.getRetiredTokens(req.params.address);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

app.get("/api/token/name/:name", async (req, res, next) => {
  try {
    const tokens = await TokenHandler.getTokensByName(req.params.name);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

app.get("/api/token/id/:id", async (req, res, next) => {
  try {
    const token = await TokenHandler.getTokenById(req.params.id);
    res.json(token);
  } catch (error) {
    next(error);
  }
});

app.get("/api/token/entity/:id", async (req, res, next) => {
  try {
    const tokens = await TokenHandler.getTokensByEntityId(req.params.id);
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

app.get("/api/token/collection/:id", async (req, res, next) => {
  try {
    const tokens = await TokenHandler.getTokensByCollection(req.params.id);
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

app.get("/api/bonds/listBonds", async (req, res, next) => {
  try {
    const bonds = await BondHandler.listAllBonds(
      req.query.page ? String(req.query.page) : undefined,
      req.query.size ? String(req.query.size) : undefined
    );
    res.json(bonds);
  } catch (error) {
    next(error);
  }
});

app.get("/api/bonds/listBondsFiltered", async (req, res, next) => {
  try {
    const bonds = await BondHandler.listAllBondsFiltered(
      req.body,
      req.query.page ? String(req.query.page) : undefined,
      req.query.size ? String(req.query.size) : undefined
    );
    res.json(bonds);
  } catch (error) {
    next(error);
  }
});

app.get("/api/bonds/getByBondDid/:bondDid", async (req, res, next) => {
  try {
    const bond = await BondHandler.listBondByBondDid(req.params.bondDid);
    res.json(bond);
  } catch (error) {
    next(error);
  }
});

app.get(
  "/api/bonds/getPriceHistoryByBondDid/:bondDid",
  async (req, res, next) => {
    try {
      const priceHistory = await BondHandler.listBondPriceHistoryByBondDid(
        req.params.bondDid,
        req.body,
        req.query.page ? String(req.query.page) : undefined,
        req.query.size ? String(req.query.size) : undefined
      );
      res.json(priceHistory);
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/bonds/getByBondCreatorDid/:creatorDid",
  async (req, res, next) => {
    try {
      const bonds = await BondHandler.listBondByCreatorDid(
        req.params.creatorDid,
        req.query.page ? String(req.query.page) : undefined,
        req.query.size ? String(req.query.size) : undefined
      );
      res.json(bonds);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/bonds/getAccountBonds/:account", async (req, res, next) => {
  try {
    const bonds = await ProtoHandler.getAccountBonds(req.params.account);
    res.json(bonds);
  } catch (error) {
    next(error);
  }
});

app.get("/api/bond/get/outcomepayments/:bonddid", async (req, res, next) => {
  try {
    const outcomePayments = await BondHandler.getOutcomeHistoryByDid(
      req.params.bonddid,
      req.query.page ? String(req.query.page) : undefined,
      req.query.size ? String(req.query.size) : undefined
    );
    res.json(outcomePayments);
  } catch (error) {
    next(error);
  }
});

app.get("/api/bond/get/alphas/:bonddid", async (req, res, next) => {
  try {
    const alphaHistory = await BondHandler.getAlphaHistoryByDid(
      req.params.bonddid,
      req.query.page ? String(req.query.page) : undefined,
      req.query.size ? String(req.query.size) : undefined
    );
    res.json(alphaHistory);
  } catch (error) {
    next(error);
  }
});

app.get("/api/bond/get/transactions/:bonddid", async (req, res, next) => {
  try {
    const transactions = await BondHandler.getTransactionHistoryBond(
      req.params.bonddid,
      req.query.page ? String(req.query.page) : undefined,
      req.query.size ? String(req.query.size) : undefined
    );
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

app.get(
  "/api/bond/get/transactions/bybuyerdid/:buyerdid",
  async (req, res, next) => {
    try {
      const transactions = await BondHandler.getTransactionHistoryBondBuyer(
        req.params.buyerdid,
        req.query.page ? String(req.query.page) : undefined,
        req.query.size ? String(req.query.size) : undefined
      );
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/bond/get/withdraw/reserve/bybonddid/:bonddid",
  async (req, res, next) => {
    try {
      const reserveWithdrawals =
        await BondHandler.getWithdrawHistoryFromBondReserveByBondDid(
          req.params.bonddid,
          req.query.page ? String(req.query.page) : undefined,
          req.query.size ? String(req.query.size) : undefined
        );
      res.json(reserveWithdrawals);
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/bond/get/withdraw/reserve/byrecipientdid/:recipientdid",
  async (req, res, next) => {
    try {
      const reserveWithdrawals =
        await BondHandler.getWithdrawHistoryFromBondReserveByWithdrawerId(
          req.params.recipientdid,
          req.query.page ? String(req.query.page) : undefined,
          req.query.size ? String(req.query.size) : undefined
        );
      res.json(reserveWithdrawals);
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/bond/get/withdraw/share/bybondid/:bonddid",
  async (req, res, next) => {
    try {
      const shareWithdrawals =
        await BondHandler.getWithdrawHistoryFromBondShareByBondDid(
          req.params.bonddid,
          req.query.page ? String(req.query.page) : undefined,
          req.query.size ? String(req.query.size) : undefined
        );
      res.json(shareWithdrawals);
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/bond/get/withdraw/share/byrecipientdid/:recipientdid",
  async (req, res, next) => {
    try {
      const shareWithdrawals =
        await BondHandler.getWithdrawHistoryFromBondShareByRecipientDid(
          req.params.recipientdid,
          req.query.page ? String(req.query.page) : undefined,
          req.query.size ? String(req.query.size) : undefined
        );
      res.json(shareWithdrawals);
    } catch (error) {
      next(error);
    }
  }
);

// =================================
// Iid
// =================================

app.get("/api/iid/getByIid/:iid", async (req, res, next) => {
  try {
    const iid = await IidHandler.getIidByIid(req.params.iid);
    res.json(iid);
  } catch (error) {
    next(error);
  }
});

// =================================
// General
// =================================

app.get("/api/event/getEventByType/:type", async (req, res, next) => {
  try {
    const events = await EventHandler.getEventsByType(
      req.params.type,
      req.query.page ? String(req.query.page) : undefined,
      req.query.size ? String(req.query.size) : undefined
    );
    res.json(events);
  } catch (error) {
    next(error);
  }
});

app.get("/api/stats/listStats", async (req, res, next) => {
  try {
    const stats = await StatHandler.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

app.get(
  "/api/transactions/getLatestTransactions/:address",
  async (req, res, next) => {
    try {
      const transactions = await TransactionHandler.getLatestTransactions(
        req.params.address,
        req.query.take as string,
        req.query.cursor as string,
        req.query.denom as string,
        req.query.type as string,
        req.query.tokenName as string
      );
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/block/getLastSyncedBlock", async (req, res, next) => {
  try {
    const block = await BlockHandler.getLastSyncedBlock();
    res.json(block);
  } catch (error) {
    next(error);
  }
});

// =================================
// CRON Jobs
// =================================
// Get antity type "asset/device" with no externalId and check if it has a deviceCredential
// Since ipfs rate limit is 200 per minute, we do 100 every 1 minutes to lessen strain
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
