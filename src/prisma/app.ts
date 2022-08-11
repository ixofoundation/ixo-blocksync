import * as express from "express";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import * as logger from "../util/logger";
import * as compression from "compression";
import * as Sentry from "@sentry/node";
import * as ProjectHandler from "./handlers/project_handler";
import * as DidHandler from "./handlers/did_handler";
import * as StatHandler from "./handlers/stats_handler";
import * as EventHandler from "./handlers/event_handler";
import * as AuthHandler from "./handlers/auth_handler";
import * as BondHandler from "./handlers/bonds_handler";
import { Connection } from "../util/connection";

class App {
    public express: express.Application;

    constructor() {
        this.express = express();
        Sentry.init({
            dsn: process.env.SENTRYDSN,
            tracesSampleRate: 1.0,
        });
        this.middleware();
        this.routes();
    };

    private middleware(): void {
        this.express.use(cors());
        this.express.use(bodyParser.urlencoded({ extended: true }));
        this.express.use(bodyParser.json());
        this.express.use(logger.before);
        this.express.use(compression());
        this.express.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
        this.express.use(Sentry.Handlers.errorHandler({
            shouldHandleError(error) {
                if (error) {
                    return true;
                }
                return false;
            },
        }) as express.ErrorRequestHandler);
    };

    private routes(): void {
        this.express.get("/", async (req, res) => {
            await res.send("API is Running");
        });

        this.express.get("/api/bond/get/outcomepayments/:bonddid", async (req, res, next) => {
            try {
                const outcomePayments = await BondHandler.getOutcomeHistoryByDid(req.params.bonddid);
                res.send(outcomePayments);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/bond/get/alphas/:bonddid", async (req, res, next) => {
            try {
                const alphaHistory = await BondHandler.getAlphaHistoryByDid(req.params.bonddid);
                res.send(alphaHistory);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/bond/get/transactions/:bonddid", async (req, res, next) => {
            try {
                const transactions = await BondHandler.getTransactionHistoryBond(req.params.bonddid);
                res.send(transactions);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/bond/get/transactions/:entityType", async (req, res, next) => {
            try {
                const transactions = await BondHandler.getTransactionHistoryBondBuyer(req.params.entityType);
                res.send(transactions);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/bond/get/withdraw/reserve/bybonddid/:bonddid", async (req, res, next) => {
            try {
                const reserveWithdrawals = await BondHandler.getWithdrawHistoryFromBondReserveByBondDid(req.params.bonddid);
                res.send(reserveWithdrawals);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/bond/get/withdraw/reserve/byrecipientdid/:recipientdid", async (req, res, next) => {
            try {
                const reserveWithdrawals = await BondHandler.getWithdrawHistoryFromBondReserveByWithdrawerId(req.params.recipientdid);
                res.send(reserveWithdrawals);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/bond/get/withdraw/share/bybondid/:bonddid", async (req, res, next) => {
            try {
                const shareWithdrawals = await BondHandler.getWithdrawHistoryFromBondShareByBondDid(req.params.bonddid);
                res.send(shareWithdrawals);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/bond/get/withdraw/share/byrecipientdid/:recipientdid", async (req, res, next) => {
            try {
                const shareWithdrawals = await BondHandler.getWithdrawHistoryFromBondShareByRecipientDid(req.params.recipientdid);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/project/listProjects", async (req, res, next) => {
            try {
                const projects = await ProjectHandler.listAllProjects();
                res.send(projects);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/project/listProjectsFiltered", async (req, res, next) => {
            try {
                const projects = await ProjectHandler.listAllProjectsFiltered(req.body);
                res.send(projects);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/project/getByEntityType/:entityType", async (req, res, next) => {
            try {
                const projects = await ProjectHandler.listProjectByEntityType(req.params.entityType);
                res.send(projects);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/project/getByProjectDid/:projectDid", async (req, res, next) => {
            try {
                const project = await ProjectHandler.listProjectByProjectDid(req.params.projectDid);
                res.send(project);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/project/getByProjectSenderDid/:senderDid", async (req, res, next) => {
            try {
                const project = await ProjectHandler.listProjectBySenderDid(req.params.senderDid);
                res.send(project);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/project/shields/status/:projectDid", async (req, res, next) => {
            try {
                const project = await ProjectHandler.listProjectByProjectDid(req.params.projectDid);
                res.send({
                    "schemaVersion": 1,
                    "label": "status",
                    "message": project?.status ? project?.status : "null",
                    "color": "blue",
                    "cacheSeconds": 300
                });
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/project/getProjectAccounts/:projectDid", async (req, res, next) => {
            try {
                const projectAccounts = await ProjectHandler.getProjectAccountsFromChain(req.params.projectDid);
                res.send(projectAccounts);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/did/getByDid/:did", async (req, res, next) => {
            try {
                const did = await DidHandler.getDidByDid(req.params.did);
                res.send(did);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/bonds/listBonds", async (req, res, next) => {
            try {
                const bonds = await BondHandler.listAllBonds();
                res.send(bonds);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/bonds/listBondsFiltered", async (req, res, next) => {
            try {
                const bonds = await BondHandler.listAllBondsFiltered(req.body);
                res.send(bonds);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/bonds/getByBondDid/:bondDid", async (req, res, next) => {
            try {
                const bond = await BondHandler.listBondByBondDid(req.params.bondDid);
                res.send(bond);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/bonds/getPriceHistoryByBondDid/:bondDid", async (req, res, next) => {
            try {
                const priceHistory = await BondHandler.listBondPriceHistoryByBondDid(req.params.bondDid, req.body);
                res.send(priceHistory);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/bonds/getByBondCreatorDid/:creatorDid", async (req, res, next) => {
            try {
                const bonds = await BondHandler.listBondByCreatorDid(req.params.creatorDid);
                res.send(bonds);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/event/getEventByType/:type", async (req, res, next) => {
            try {
                const events = await EventHandler.getEventsByType(req.params.type);
                res.send(events);
            } catch (error) {
                next(error)
            }
        });

        this.express.get("/api/stats/listStats", async (req, res, next) => {
            try {
                const stats = await StatHandler.getStats();
                res.send(stats[0]);
            } catch (error) {
                next(error)
            }
        });

        this.express.post("/api/blockchain/txs", async (req, res, next) => {
            try {
                const bcConn = new Connection(
                    this.express.get("chainUri"),
                    this.express.get("bcRest"),
                    this.express.get("bondsInfoExtractPeriod"),
                );
                const result = bcConn.sendTransaction(req.body)
                res.send(result)
            } catch (error) {
                next(error)
            }
        });

        this.express.post("/api/sign_data", async (req, res, next) => {
            try {
                const response = await AuthHandler.getSignData(req.body.msg, req.body.pub_key);
                res.send(response);
            } catch (error) {
                next(error)
            }

        });

        this.express.use(logger.after);
    }

};

export default new App().express;