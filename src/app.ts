import express, { Request, Response, NextFunction } from "express";
import expressWs from "express-ws";
import cors from "cors";
import bodyParser from "body-parser";
import * as logger from "./util/logger";
import compression from "compression";
import * as Sentry from "@sentry/node";
import postgraphile from "postgraphile";

import * as ProjectHandler from "./handlers/project_handler";
import * as IidHandler from "./handlers/iid_handler";
import * as StatHandler from "./handlers/stats_handler";
import * as EventHandler from "./handlers/event_handler";
import * as AuthHandler from "./handlers/auth_handler";
import * as BondHandler from "./handlers/bond_handler";
import * as TransactionHandler from "./handlers/transaction_handler";
import * as BlockHandler from "./handlers/block_handler";
import { sendTransaction } from "./util/connection";
import { SENTRYDSN, DATABASE_URL } from "./util/secrets";

export const app = expressWs(express()).app;

Sentry.init({ dsn: SENTRYDSN, tracesSampleRate: 1.0 });
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger.before);
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
    }),
);

app.get("/", (req: Request, res) => {
    res.send("API is Running");
});

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
app.ws("/api/bonds/listBonds", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const bonds = await BondHandler.listAllBonds(
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            ws.send(JSON.stringify(bonds));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws("/api/bonds/listBondsFiltered", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const bonds = await BondHandler.listAllBondsFiltered(
                req.body,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            ws.send(JSON.stringify(bonds));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws("/api/bonds/getByBondDid/:bondDid", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const bond = await BondHandler.listBondByBondDid(
                req.params.bondDid,
            );
            ws.send(JSON.stringify(bond));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws(
    "/api/bonds/getPriceHistoryByBondDid/:bondDid",
    async (ws, req, next) => {
        ws.on("message", async () => {
            try {
                const priceHistory =
                    await BondHandler.listBondPriceHistoryByBondDid(
                        req.params.bondDid,
                        req.body,
                        req.query.page ? String(req.query.page) : undefined,
                        req.query.size ? String(req.query.size) : undefined,
                    );
                ws.send(JSON.stringify(priceHistory));
            } catch (error) {
                next(error);
            }
        });
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
app.ws("/api/bonds/getByBondCreatorDid/:creatorDid", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const bonds = await BondHandler.listBondByCreatorDid(
                req.params.creatorDid,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            ws.send(JSON.stringify(bonds));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws("/api/bond/get/outcomepayments/:bonddid", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const outcomePayments = await BondHandler.getOutcomeHistoryByDid(
                req.params.bonddid,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            ws.send(JSON.stringify(outcomePayments));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws("/api/bond/get/alphas/:bonddid", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const alphaHistory = await BondHandler.getAlphaHistoryByDid(
                req.params.bonddid,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            ws.send(JSON.stringify(alphaHistory));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws("/api/bond/get/transactions/:bonddid", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const transactions = await BondHandler.getTransactionHistoryBond(
                req.params.bonddid,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            ws.send(JSON.stringify(transactions));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws(
    "/api/bond/get/transactions/bybuyerdid/:buyerdid",
    async (ws, req, next) => {
        ws.on("message", async () => {
            try {
                const transactions =
                    await BondHandler.getTransactionHistoryBondBuyer(
                        req.params.buyerdid,
                        req.query.page ? String(req.query.page) : undefined,
                        req.query.size ? String(req.query.size) : undefined,
                    );
                ws.send(JSON.stringify(transactions));
            } catch (error) {
                next(error);
            }
        });
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
app.ws(
    "/api/bond/get/withdraw/reserve/bybonddid/:bonddid",
    async (ws, req, next) => {
        ws.on("message", async () => {
            try {
                const reserveWithdrawals =
                    await BondHandler.getWithdrawHistoryFromBondReserveByBondDid(
                        req.params.bonddid,
                        req.query.page ? String(req.query.page) : undefined,
                        req.query.size ? String(req.query.size) : undefined,
                    );
                ws.send(JSON.stringify(reserveWithdrawals));
            } catch (error) {
                next(error);
            }
        });
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
app.ws(
    "/api/bond/get/withdraw/reserve/byrecipientdid/:recipientdid",
    async (ws, req, next) => {
        ws.on("message", async () => {
            try {
                const reserveWithdrawals =
                    await BondHandler.getWithdrawHistoryFromBondReserveByWithdrawerId(
                        req.params.recipientdid,
                        req.query.page ? String(req.query.page) : undefined,
                        req.query.size ? String(req.query.size) : undefined,
                    );
                ws.send(JSON.stringify(reserveWithdrawals));
            } catch (error) {
                next(error);
            }
        });
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
app.ws(
    "/api/bond/get/withdraw/share/bybondid/:bonddid",
    async (ws, req, next) => {
        ws.on("message", async () => {
            try {
                const shareWithdrawals =
                    await BondHandler.getWithdrawHistoryFromBondShareByBondDid(
                        req.params.bonddid,
                        req.query.page ? String(req.query.page) : undefined,
                        req.query.size ? String(req.query.size) : undefined,
                    );
                ws.send(JSON.stringify(shareWithdrawals));
            } catch (error) {
                next(error);
            }
        });
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
app.ws(
    "/api/bond/get/withdraw/share/byrecipientdid/:recipientdid",
    async (ws, req, next) => {
        ws.on("message", async () => {
            try {
                const shareWithdrawals =
                    await BondHandler.getWithdrawHistoryFromBondShareByRecipientDid(
                        req.params.recipientdid,
                        req.query.page ? String(req.query.page) : undefined,
                        req.query.size ? String(req.query.size) : undefined,
                    );
                ws.send(JSON.stringify(shareWithdrawals));
            } catch (error) {
                next(error);
            }
        });
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
app.ws("/api/project/listProjects", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const projects = await ProjectHandler.listAllProjects(
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            ws.send(JSON.stringify(projects));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws("/api/project/listProjectsFiltered", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const projects = await ProjectHandler.listAllProjectsFiltered(
                req.body,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            ws.send(JSON.stringify(projects));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws("/api/project/getByEntityType/:entityType", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const projects = await ProjectHandler.listProjectByEntityType(
                req.params.entityType,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            ws.send(JSON.stringify(projects));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws("/api/project/getByProjectDid/:projectDid", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const project = await ProjectHandler.listProjectByProjectDid(
                req.params.projectDid,
            );
            ws.send(JSON.stringify(project));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws(
    "/api/project/getByProjectSenderDid/:senderDid",
    async (ws, req, next) => {
        ws.on("message", async () => {
            try {
                const project = await ProjectHandler.listProjectBySenderDid(
                    req.params.senderDid,
                    req.query.page ? String(req.query.page) : undefined,
                    req.query.size ? String(req.query.size) : undefined,
                );
                ws.send(JSON.stringify(project));
            } catch (error) {
                next(error);
            }
        });
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
app.ws("/api/project/shields/status/:projectDid", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const project = await ProjectHandler.listProjectByProjectDid(
                req.params.projectDid,
            );
            ws.send(
                JSON.stringify({
                    schemaVersion: 1,
                    label: "status",
                    message: project?.status ? project?.status : "null",
                    color: "blue",
                    cacheSeconds: 300,
                }),
            );
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws("/api/project/getProjectAccounts/:projectDid", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const projectAccounts =
                await ProjectHandler.getProjectAccountsFromChain(
                    req.params.projectDid,
                );
            ws.send(JSON.stringify(projectAccounts));
        } catch (error) {
            next(error);
        }
    });
});

app.get(
    "api/iid/getByIid/:iid",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const iid = await IidHandler.getIidByIid(req.params.iid);
            res.json(iid);
        } catch (error) {
            next(error);
        }
    },
);
app.ws("api/iid/getByIid/:iid", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const iid = await IidHandler.getIidByIid(req.params.iid);
            ws.send(JSON.stringify(iid));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws("/api/event/getEventByType/:type", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const events = await EventHandler.getEventsByType(
                req.params.type,
                req.query.page ? String(req.query.page) : undefined,
                req.query.size ? String(req.query.size) : undefined,
            );
            ws.send(JSON.stringify(events));
        } catch (error) {
            next(error);
        }
    });
});

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
app.ws("/api/stats/listStats", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const stats = await StatHandler.getStats();
            ws.send(JSON.stringify(stats));
        } catch (error) {
            next(error);
        }
    });
});

app.get(
    "api/transactions/listTransactionsByType/:type(*)",
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
app.ws(
    "api/transactions/listTransactionsByType/:type(*)",
    async (ws, req, next) => {
        ws.on("message", async () => {
            try {
                const transactions =
                    await TransactionHandler.listTransactionsByType(
                        req.params.type,
                        req.query.page ? String(req.query.page) : undefined,
                        req.query.size ? String(req.query.size) : undefined,
                    );
                ws.send(JSON.stringify(transactions));
            } catch (error) {
                next(error);
            }
        });
    },
);

app.get(
    "api/transactions/listTransactionsByAddress/:address",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const transactions =
                await TransactionHandler.listTransactionsByAddress(
                    req.params.address,
                    req.query.page ? String(req.query.page) : undefined,
                    req.query.size ? String(req.query.size) : undefined,
                );
            res.json(transactions);
        } catch (error) {
            next(error);
        }
    },
);
app.ws(
    "api/transactions/listTransactionsByAddress/:address",
    async (ws, req, next) => {
        ws.on("message", async () => {
            try {
                const transactions =
                    await TransactionHandler.listTransactionsByAddress(
                        req.params.address,
                        req.query.page ? String(req.query.page) : undefined,
                        req.query.size ? String(req.query.size) : undefined,
                    );
                ws.send(JSON.stringify(transactions));
            } catch (error) {
                next(error);
            }
        });
    },
);

app.get(
    "api/transactions/listTransactionsByAddressAndType/:address/:type(*)",
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const transactions =
                await TransactionHandler.listTransactionsByAddressAndType(
                    req.params.address,
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
app.ws(
    "api/transactions/listTransactionsByAddressAndType/:address/:type(*)",
    async (ws, req, next) => {
        ws.on("message", async () => {
            try {
                const transactions =
                    await TransactionHandler.listTransactionsByAddressAndType(
                        req.params.address,
                        req.params.type,
                        req.query.page ? String(req.query.page) : undefined,
                        req.query.size ? String(req.query.size) : undefined,
                    );
                ws.send(JSON.stringify(transactions));
            } catch (error) {
                next(error);
            }
        });
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
app.ws("/api/block/getLastSyncedBlock", async (ws, req, next) => {
    ws.on("message", async () => {
        try {
            const block = await BlockHandler.getLastSyncedBlock();
            ws.send(JSON.stringify(block));
        } catch (error) {
            next(error);
        }
    });
});

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

app.use(logger.after);
