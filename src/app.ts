import * as express from "express";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import * as logger from "./util/logger";
import * as compression from "compression";
import * as Sentry from "@sentry/node";
import * as ProjectHandler from "./handlers/project_handler";
import * as DidHandler from "./handlers/did_handler";
import * as IidHandler from "./handlers/iid_handler";
import * as StatHandler from "./handlers/stats_handler";
import * as EventHandler from "./handlers/event_handler";
import * as AuthHandler from "./handlers/auth_handler";
import * as BondHandler from "./handlers/bond_handler";
import * as TransactionHandler from "./handlers/transaction_handler";
import * as BlockHandler from "./handlers/block_handler";
import { sendTransaction } from "./util/connection";
import { SENTRYDSN, DATABASE_URL } from "./util/secrets";

const { postgraphile } = require("postgraphile");

class App {
    public express: any;

    constructor() {
        this.express = express();
        Sentry.init({
            dsn: SENTRYDSN,
            tracesSampleRate: 1.0,
        });
        this.middleware();
        this.routes();
    }

    private middleware(): void {
        this.express.use(cors());
        this.express.use(bodyParser.urlencoded({ extended: true }));
        this.express.use(bodyParser.json());
        this.express.use(logger.before);
        this.express.use(compression());
        this.express.use(
            Sentry.Handlers.requestHandler() as express.RequestHandler,
        );
        this.express.use(
            Sentry.Handlers.errorHandler({
                shouldHandleError(error) {
                    if (error) {
                        return true;
                    }
                    return false;
                },
            }) as express.ErrorRequestHandler,
        );
        this.express.use(
            postgraphile(DATABASE_URL, "public", {
                watchPg: true,
                graphiql: true,
                enhanceGraphiql: true,
                dynamicJson: true,
            }),
        );
    }

    private routes(): void {
        this.express.get("/", (req, res) => {
            res.send("API is Running");
        });

        this.express.get("/api/bonds/listBonds", async (req, res, next) => {
            try {
                const bonds = await BondHandler.listAllBonds(
                    req.query.page,
                    req.query.size,
                );
                res.json(bonds);
            } catch (error) {
                next(error);
            }
        });

        this.express.get(
            "/api/bonds/listBondsFiltered",
            async (req, res, next) => {
                try {
                    const bonds = await BondHandler.listAllBondsFiltered(
                        req.body,
                        req.query.page,
                        req.query.size,
                    );
                    res.json(bonds);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/bonds/getByBondDid/:bondDid",
            async (req, res, next) => {
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

        this.express.get(
            "/api/bonds/getPriceHistoryByBondDid/:bondDid",
            async (req, res, next) => {
                try {
                    const priceHistory =
                        await BondHandler.listBondPriceHistoryByBondDid(
                            req.params.bondDid,
                            req.body,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(priceHistory);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/bonds/getByBondCreatorDid/:creatorDid",
            async (req, res, next) => {
                try {
                    const bonds = await BondHandler.listBondByCreatorDid(
                        req.params.creatorDid,
                        req.query.page,
                        req.query.size,
                    );
                    res.json(bonds);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/bond/get/outcomepayments/:bonddid",
            async (req, res, next) => {
                try {
                    const outcomePayments =
                        await BondHandler.getOutcomeHistoryByDid(
                            req.params.bonddid,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(outcomePayments);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/bond/get/alphas/:bonddid",
            async (req, res, next) => {
                try {
                    const alphaHistory = await BondHandler.getAlphaHistoryByDid(
                        req.params.bonddid,
                        req.query.page,
                        req.query.size,
                    );
                    res.json(alphaHistory);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/bond/get/transactions/:bonddid",
            async (req, res, next) => {
                try {
                    const transactions =
                        await BondHandler.getTransactionHistoryBond(
                            req.params.bonddid,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(transactions);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/bond/get/transactions/bybuyerdid/:buyerdid",
            async (req, res, next) => {
                try {
                    const transactions =
                        await BondHandler.getTransactionHistoryBondBuyer(
                            req.params.buyerdid,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(transactions);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/bond/get/withdraw/reserve/bybonddid/:bonddid",
            async (req, res, next) => {
                try {
                    const reserveWithdrawals =
                        await BondHandler.getWithdrawHistoryFromBondReserveByBondDid(
                            req.params.bonddid,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(reserveWithdrawals);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/bond/get/withdraw/reserve/byrecipientdid/:recipientdid",
            async (req, res, next) => {
                try {
                    const reserveWithdrawals =
                        await BondHandler.getWithdrawHistoryFromBondReserveByWithdrawerId(
                            req.params.recipientdid,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(reserveWithdrawals);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/bond/get/withdraw/share/bybondid/:bonddid",
            async (req, res, next) => {
                try {
                    const shareWithdrawals =
                        await BondHandler.getWithdrawHistoryFromBondShareByBondDid(
                            req.params.bonddid,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(shareWithdrawals);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/bond/get/withdraw/share/byrecipientdid/:recipientdid",
            async (req, res, next) => {
                try {
                    const shareWithdrawals =
                        await BondHandler.getWithdrawHistoryFromBondShareByRecipientDid(
                            req.params.recipientdid,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(shareWithdrawals);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/project/listProjects",
            async (req, res, next) => {
                try {
                    const projects = await ProjectHandler.listAllProjects(
                        req.query.page,
                        req.query.size,
                    );
                    res.json(projects);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/project/listProjectsFiltered",
            async (req, res, next) => {
                try {
                    const projects =
                        await ProjectHandler.listAllProjectsFiltered(
                            req.body,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(projects);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/project/getByEntityType/:entityType",
            async (req, res, next) => {
                try {
                    const projects =
                        await ProjectHandler.listProjectByEntityType(
                            req.params.entityType,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(projects);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/project/getByProjectDid/:projectDid",
            async (req, res, next) => {
                try {
                    const project =
                        await ProjectHandler.listProjectByProjectDid(
                            req.params.projectDid,
                        );
                    res.json(project);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/project/getByProjectSenderDid/:senderDid",
            async (req, res, next) => {
                try {
                    const project = await ProjectHandler.listProjectBySenderDid(
                        req.params.senderDid,
                        req.query.page,
                        req.query.size,
                    );
                    res.json(project);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/project/shields/status/:projectDid",
            async (req, res, next) => {
                try {
                    const project =
                        await ProjectHandler.listProjectByProjectDid(
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

        this.express.get(
            "/api/project/getProjectAccounts/:projectDid",
            async (req, res, next) => {
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

        this.express.get("/api/did/getByDid/:did", async (req, res, next) => {
            try {
                const did = await DidHandler.getDidByDid(req.params.did);
                res.json(did);
            } catch (error) {
                next(error);
            }
        });

        this.express.get("api/iid/getByIid/:iid", async (req, res, next) => {
            try {
                const iid = await IidHandler.getIidByIid(req.params.iid);
                res.json(iid);
            } catch (error) {
                next(error);
            }
        });

        this.express.get(
            "/api/event/getEventByType/:type",
            async (req, res, next) => {
                try {
                    const events = await EventHandler.getEventsByType(
                        req.params.type,
                        req.query.page,
                        req.query.size,
                    );
                    res.json(events);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get("/api/stats/listStats", async (req, res, next) => {
            try {
                const stats = await StatHandler.getStats();
                res.json(stats);
            } catch (error) {
                next(error);
            }
        });

        this.express.get(
            "api/transactions/listTransactionsByType/:type(*)",
            async (res, req, next) => {
                try {
                    const transactions =
                        await TransactionHandler.listTransactionsByType(
                            req.params.type,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(transactions);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "api/transactions/listTransactionsByAddress/:address",
            async (res, req, next) => {
                try {
                    const transactions =
                        await TransactionHandler.listTransactionsByAddress(
                            req.params.address,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(transactions);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "api/transactions/listTransactionsByAddressAndType/:address/:type(*)",
            async (res, req, next) => {
                try {
                    const transactions =
                        await TransactionHandler.listTransactionsByAddressAndType(
                            req.params.address,
                            req.params.type,
                            req.query.page,
                            req.query.size,
                        );
                    res.json(transactions);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.get(
            "/api/block/getLastSyncedBlock",
            async (req, res, next) => {
                try {
                    const block = await BlockHandler.getLastSyncedBlock();
                    res.json(block);
                } catch (error) {
                    next(error);
                }
            },
        );

        this.express.post("/api/blockchain/txs", async (req, res, next) => {
            try {
                const response = await sendTransaction(req.body);
                res.json(response);
            } catch (error) {
                next(error);
            }
        });

        this.express.post("/api/sign_data", async (req, res, next) => {
            try {
                const response = await AuthHandler.getSignData(
                    req.body.msg,
                    req.body.pub_key,
                );
                res.json(response);
            } catch (error) {
                next(error);
            }
        });

        this.express.use(logger.after);
    }
}

export default new App().express;
