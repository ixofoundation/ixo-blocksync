import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import compression from "compression";
import * as Sentry from "@sentry/node";
import postgraphile from "postgraphile";
import * as StorageHandler from "./handlers/storage_handler";
import * as ProjectHandler from "./handlers/project_handler";
import * as IidHandler from "./handlers/iid_handler";
import * as EntityHandler from "./handlers/entity_handler";
import * as TokenHandler from "./handlers/token_handler";
import * as StatHandler from "./handlers/stats_handler";
import * as EventHandler from "./handlers/event_handler";
import * as AuthHandler from "./handlers/auth_handler";
import * as BondHandler from "./handlers/bond_handler";
import * as TransactionHandler from "./handlers/transaction_handler";
import * as BlockHandler from "./handlers/block_handler";
import * as PaymentHandler from "./handlers/payment_handler";
import { sendTransaction } from "./util/connection";
import { SENTRYDSN, DATABASE_URL } from "./util/secrets";

import swaggerUi from "swagger-ui-express";
const swaggerFile = require(`${__dirname}/../../swagger.json`);

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getAccountBonds } from "./util/proto";

export const app = express();

Sentry.init({ dsn: SENTRYDSN, tracesSampleRate: 1.0 });
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(compression());
app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
app.use(
    Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
            if (error) return true;
            return false;
        },
    }) as express.ErrorRequestHandler,
);
app.use(
    postgraphile(DATABASE_URL, "public", {
        watchPg: true,
        graphiql: true,
        enhanceGraphiql: true,
        dynamicJson: true,
        disableDefaultMutations: true,
    }),
);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(helmet());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100000,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

app.get("/", (req: Request, res) => {
    res.send("API is Running");
});

app.post("/storage/store", async (req, res) => {
    const file = await StorageHandler.store(
        req.body.name,
        req.body.contentType,
        req.body.data,
    );
    res.json(file);
});

app.get("/storage/retrieve/:cid", async (req, res) => {
    const file = await StorageHandler.retrieve(req.params.cid);
    res.json(file);
});

app.get(
    "/api/entity/byId/:id",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const entity = await EntityHandler.getEntityById(req.params.id);
            res.json(entity);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/entity/byOwnerDid/:did",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const entities = await EntityHandler.getEntitiesByOwnerDid(
                req.params.did,
            );
            res.json(entities);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/entity/collections",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const entities = await EntityHandler.getEntityCollections();
            res.json(entities);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/entity/collectionById/:id",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const entities = await EntityHandler.getEntityCollectionById(
                req.params.id,
            );
            res.json(entities);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/entity/collectionsByOwnerDid/:did",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const entities = await EntityHandler.getEntityCollectionsByOwnerDid(
                req.params.did,
            );
            res.json(entities);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/tokenclass/contractaddress/:contractAddress",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tokenClass =
                await TokenHandler.getTokenClassByContractAddress(
                    req.params.contractAddress,
                );
            res.json(tokenClass);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/tokenclass/name/:name",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tokenClass = await TokenHandler.getTokenClassByName(
                req.params.name,
            );
            res.json(tokenClass);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/token/name/:name",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tokens = await TokenHandler.getTokensByName(req.params.name);
            res.json(tokens);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/token/id/:id",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = await TokenHandler.getTokenById(req.params.id);
            res.json(token);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bonds/listBonds",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bonds = await BondHandler.listAllBonds(
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            res.json(bonds);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bonds/listBondsFiltered",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bonds = await BondHandler.listAllBondsFiltered(
                req.body,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            res.json(bonds);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bonds/getByBondDid/:bondDid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bond = await BondHandler.listBondByBondDid(
                req.params.bondDid,
            );
            res.json(bond);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bonds/getPriceHistoryByBondDid/:bondDid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const priceHistory =
                await BondHandler.listBondPriceHistoryByBondDid(
                    req.params.bondDid,
                    req.body,
                    req.query.page ? String(req.query.page) : undefined,
                    req.query.size ? String(req.query.size) : undefined,
                );
            res.json(priceHistory);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bonds/getByBondCreatorDid/:creatorDid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bonds = await BondHandler.listBondByCreatorDid(
                req.params.creatorDid,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            res.json(bonds);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bonds/getAccountBonds/:account",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bonds = await getAccountBonds(req.params.address);
            res.json(bonds);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bond/get/outcomepayments/:bonddid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const outcomePayments = await BondHandler.getOutcomeHistoryByDid(
                req.params.bonddid,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            res.json(outcomePayments);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bond/get/alphas/:bonddid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const alphaHistory = await BondHandler.getAlphaHistoryByDid(
                req.params.bonddid,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            res.json(alphaHistory);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bond/get/transactions/:bonddid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const transactions = await BondHandler.getTransactionHistoryBond(
                req.params.bonddid,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            res.json(transactions);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bond/get/transactions/bybuyerdid/:buyerdid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const transactions =
                await BondHandler.getTransactionHistoryBondBuyer(
                    req.params.buyerdid,
                    req.query.page ? String(req.query.page) : undefined,
                    req.query.size ? String(req.query.size) : undefined,
                );
            res.json(transactions);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bond/get/withdraw/reserve/bybonddid/:bonddid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const reserveWithdrawals =
                await BondHandler.getWithdrawHistoryFromBondReserveByBondDid(
                    req.params.bonddid,
                    req.query.page ? String(req.query.page) : undefined,
                    req.query.size ? String(req.query.size) : undefined,
                );
            res.json(reserveWithdrawals);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bond/get/withdraw/reserve/byrecipientdid/:recipientdid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const reserveWithdrawals =
                await BondHandler.getWithdrawHistoryFromBondReserveByWithdrawerId(
                    req.params.recipientdid,
                    req.query.page ? String(req.query.page) : undefined,
                    req.query.size ? String(req.query.size) : undefined,
                );
            res.json(reserveWithdrawals);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bond/get/withdraw/share/bybondid/:bonddid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const shareWithdrawals =
                await BondHandler.getWithdrawHistoryFromBondShareByBondDid(
                    req.params.bonddid,
                    req.query.page ? String(req.query.page) : undefined,
                    req.query.size ? String(req.query.size) : undefined,
                );
            res.json(shareWithdrawals);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/bond/get/withdraw/share/byrecipientdid/:recipientdid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const shareWithdrawals =
                await BondHandler.getWithdrawHistoryFromBondShareByRecipientDid(
                    req.params.recipientdid,
                    req.query.page ? String(req.query.page) : undefined,
                    req.query.size ? String(req.query.size) : undefined,
                );
            res.json(shareWithdrawals);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/project/listProjects",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const projects = await ProjectHandler.listAllProjects(
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            res.json(projects);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/project/listProjectsFiltered",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const projects = await ProjectHandler.listAllProjectsFiltered(
                req.body,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            res.json(projects);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/project/getByEntityType/:entityType",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const projects = await ProjectHandler.listProjectByEntityType(
                req.params.entityType,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            res.json(projects);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/project/getByProjectDid/:projectDid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = await ProjectHandler.listProjectByProjectDid(
                req.params.projectDid,
            );
            res.json(project);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/project/getProjectsByCreatedAndAgent/:did",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = await ProjectHandler.getProjectsByCreatedAndAgent(
                req.params.did,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            res.json(project);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/project/getByProjectSenderDid/:senderDid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = await ProjectHandler.listProjectBySenderDid(
                req.params.senderDid,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            res.json(project);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/project/shields/status/:projectDid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = await ProjectHandler.listProjectByProjectDid(
                req.params.projectDid,
            );
            res.json({
                schemaVersion: 1,
                label: "status",
                message: project?.status ? project?.status : "null",
                color: "blue",
                cacheSeconds: 300,
            });
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/project/getProjectAccounts/:projectDid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const projectAccounts =
                await ProjectHandler.getProjectAccountsFromChain(
                    req.params.projectDid,
                );
            res.json(projectAccounts);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/iid/getByIid/:iid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const iid = await IidHandler.getIidByIid(req.params.iid);
            res.json(iid);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/did/getByDid/:did",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const iid = await IidHandler.getDidByDid(req.params.did);
            res.json(iid);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/event/getEventByType/:type",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const events = await EventHandler.getEventsByType(
                req.params.type,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            res.json(events);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/stats/listStats",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await StatHandler.getStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/transactions/listTransactionsByType/:type(*)",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const transactions =
                await TransactionHandler.listTransactionsByType(
                    req.params.type,
                    req.query.page ? String(req.query.page) : undefined,
                    req.query.size ? String(req.query.size) : undefined,
                );
            res.json(transactions);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/block/getLastSyncedBlock",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const block = await BlockHandler.getLastSyncedBlock();
            res.json(block);
        } catch (error) {
            next(error);
        }
    },
);

app.get(
    "/api/getPaymentTemplateById/:id",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const template = await PaymentHandler.getPaymentTemplateById(
                req.params.id,
            );
            res.json(template);
        } catch (error) {
            next(error);
        }
    },
);

app.post(
    "/api/blockchain/txs",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const response = await sendTransaction(req.body);
            res.json(response);
        } catch (error) {
            next(error);
        }
    },
);

app.post(
    "/api/sign_data",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const response = await AuthHandler.getSignData(
                req.body.msg,
                req.body.pub_key,
            );
            res.json(response);
        } catch (error) {
            next(error);
        }
    },
);
