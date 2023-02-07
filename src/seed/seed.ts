import { readFileSync } from "fs";
import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";
import { getIid } from "../util/proto";

let agentsErrors = 0;
const seedAgents = async () => {
    try {
        const projects = JSON.parse(
            readFileSync("src/seed/json_exports/projects.json").toString(),
        );
        for (const project of projects) {
            for (const agent of project.data.agents) {
                try {
                    await prisma.agent.create({
                        data: {
                            agentDid: agent.did,
                            projectDid: project.projectDid,
                            status: agent.status,
                            role: agent.role,
                        },
                    });
                } catch (error) {
                    console.log(error);
                    agentsErrors++;
                }
            }
        }
    } catch (error) {
        console.log(error);
        agentsErrors++;
    }
};

let alphaErrors = 0;
const seedAlphas = async () => {
    try {
        const alphas = JSON.parse(
            readFileSync("src/seed/json_exports/alphas.json").toString(),
        );
        for (const alpha of alphas) {
            try {
                const rawValue = JSON.parse(alpha.raw_value);
                await prisma.alpha.create({
                    data: {
                        bondDid: alpha.bond_did,
                        alpha: rawValue.value.alpha,
                        height: alpha.height,
                        timestamp: alpha.timestamp,
                        delta: "",
                        oracleDid: "",
                        oracleAddress: "",
                    },
                });
            } catch (error) {
                console.log(error);
                alphaErrors++;
            }
        }
    } catch (error) {
        console.log(error);
        alphaErrors++;
    }
};

let bondsErrors = 0;
const seedBonds = async () => {
    try {
        const bonds = JSON.parse(
            readFileSync("src/seed/json_exports/bonds.json").toString(),
        );
        for (const bond of bonds) {
            try {
                await prisma.bond.create({
                    data: {
                        bondDid: bond.did,
                        token: bond.token,
                        name: bond.name,
                        description: bond.description,
                        creatorDid: bond.creatorDid,
                        status: "",
                        functionType: "",
                        controllerDid: "",
                        reserveTokens: [""],
                        txFeePercentage: "",
                        exitFeePercentage: "",
                        feeAddress: "",
                        reserveWithdrawalAddress: "",
                        sanityRate: "",
                        sanityMarginPercentage: "",
                        allowSells: true,
                        allowReserveWithdrawals: true,
                        alphaBond: true,
                        batchBlocks: "",
                        creatorAddress: "",
                    },
                });
                for (const priceEntry of bond.priceHistory) {
                    await prisma.priceEntry.create({
                        data: {
                            bondDid: bond.did,
                            time: new Date(
                                Number(priceEntry.time.$date.$numberLong),
                            ),
                            denom: "",
                            price: new Prisma.Decimal(priceEntry.price),
                        },
                    });
                }
            } catch (error) {
                console.log(error);
                bondsErrors++;
            }
        }
    } catch (error) {
        console.log(error);
        bondsErrors++;
    }
};

let chainsErrors = 0;
const seedChains = async () => {
    try {
        const chains = JSON.parse(
            readFileSync("src/seed/json_exports/chains.json").toString(),
        );
        for (const chain of chains) {
            try {
                await prisma.chain.create({
                    data: {
                        chainId: chain.chainId,
                        blockHeight: chain.blockHeight,
                    },
                });
            } catch (error) {
                console.log(error);
                chainsErrors++;
            }
        }
    } catch (error) {
        console.log(error);
        chainsErrors++;
    }
};

let didsErrors = 0;
const seedDids = async () => {
    try {
        const dids = JSON.parse(
            readFileSync("src/seed/json_exports/dids.json").toString(),
        );
        for (const did of dids) {
            try {
                const iid = await getIid(did.did);
                await prisma.iID.create({
                    data: {
                        id: String(iid?.id),
                        updated: new Date().toString(),
                        created: new Date().toString(),
                        Controller: iid?.controller,
                        Context: JSON.stringify(iid?.context),
                    },
                });
                if (iid?.verificationMethod) {
                    for (const verificationMethod of iid.verificationMethod) {
                        await prisma.verificationMethod.create({
                            data: {
                                id: verificationMethod.id,
                                iid: iid.id,
                                relationships: "",
                                type: verificationMethod.type,
                                controller: verificationMethod.controller,
                                verificationMaterial:
                                    verificationMethod.blockchainAccountID ||
                                    verificationMethod.publicKeyHex ||
                                    verificationMethod.publicKeyMultibase ||
                                    verificationMethod.publicKeyBase58 ||
                                    "",
                            },
                        });
                    }
                }
                if (iid?.service) {
                    for (const service of iid.service) {
                        await prisma.service.create({
                            data: {
                                id: service.id,
                                iid: iid.id,
                                type: service.type,
                                serviceEndpoint: service.serviceEndpoint,
                            },
                        });
                    }
                }
                if (iid?.accordedRight) {
                    for (const accordedRight of iid.accordedRight) {
                        await prisma.accordedRight.create({
                            data: {
                                id: accordedRight.id,
                                iid: iid.id,
                                type: accordedRight.type,
                                mechanism: accordedRight.mechanism,
                                service: accordedRight.service,
                            },
                        });
                    }
                }
                if (iid?.linkedResource) {
                    for (const linkedResource of iid.linkedResource) {
                        await prisma.linkedResource.create({
                            data: {
                                id: linkedResource.id,
                                iid: iid.id,
                                type: linkedResource.type,
                                description: linkedResource.description,
                                mediaType: linkedResource.mediaType,
                                serviceEndpoint: linkedResource.serviceEndpoint,
                                proof: linkedResource.proof,
                                encrypted: linkedResource.encrypted,
                                right: linkedResource.right,
                            },
                        });
                    }
                }
                if (iid?.linkedEntity) {
                    for (const linkedEntity of iid.linkedEntity) {
                        await prisma.linkedEntity.create({
                            data: {
                                id: linkedEntity.id,
                                iid: iid.id,
                                relationship: linkedEntity.relationship,
                            },
                        });
                    }
                }
            } catch (error) {
                console.log(error);
                didsErrors++;
            }
        }
    } catch (error) {
        console.log(error);
        didsErrors++;
    }
};

let eventsErrors = 0;
const seedEvents = async () => {
    try {
        const events = JSON.parse(
            readFileSync("src/seed/json_exports/events.json").toString(),
        );
        for (const event of events) {
            try {
                await prisma.event.create({
                    data: {
                        type: event.type,
                        attributes: event.attributes,
                        blockHeight: event.context.blockHeight,
                        timestamp: new Date(
                            Number(event.context.$date.$numberLong),
                        ),
                    },
                });
            } catch (error) {
                console.log(error);
                eventsErrors++;
            }
        }
    } catch (error) {
        console.log(error);
        eventsErrors++;
    }
};

let paymentoutcomesErrors = 0;
const seedPaymentOutcomes = async () => {
    try {
        const paymentOutcomes = JSON.parse(
            readFileSync(
                "src/seed/json_exports/paymentoutcomes.json",
            ).toString(),
        );
        for (const paymentOutcome of paymentOutcomes) {
            try {
                const rawValue = JSON.parse(paymentOutcome.raw_value);
                await prisma.outcomePayment.create({
                    data: {
                        bondDid: paymentOutcome.bond_did.slice(1, -1),
                        senderDid: paymentOutcome.sender_did.slice(1, -1),
                        amount: rawValue.msg[0].value.amount.slice(1, -1),
                        height: paymentOutcome.height,
                        timestamp: paymentOutcome.timestamp,
                        senderAddress: "",
                    },
                });
            } catch (error) {
                console.log(error);
                paymentoutcomesErrors++;
            }
        }
    } catch (error) {
        console.log(error);
        paymentoutcomesErrors++;
    }
};

let projectsErrors = 0;
const seedProjects = async () => {
    try {
        const projects = JSON.parse(
            readFileSync("src/seed/json_exports/projects.json").toString(),
        );
        for (const project of projects) {
            try {
                await prisma.project.create({
                    data: {
                        projectDid: project.projectDid,
                        txHash: project.txHash,
                        senderDid: project.senderDid,
                        pubKey: project.pubKey,
                        data: JSON.stringify(project.data),
                        projectAddress: "",
                        status: project.status,
                        entityType: "",
                        createdOn:
                            new Date(
                                Number(
                                    project.data.createdOn.$date.$numberLong,
                                ),
                            ) || new Date(),
                        createdBy: project.data.createdBy,
                        successfulClaims:
                            project.data.claimStats.currentSuccessful,
                        rejectedClaims: project.data.claimStats.currentRejected,
                        evaluators: project.data.agentStats.evaluators,
                        evaluatorsPending:
                            project.data.agentStats.evaluatorsPending,
                        serviceProviders:
                            project.data.agentStats.serviceProviders,
                        serviceProvidersPending:
                            project.data.agentStats.serviceProvidersPending,
                        investors: project.data.agentStats.investors,
                        investorsPending:
                            project.data.agentStats.investorsPending,
                    },
                });
            } catch (error) {
                console.log(error);
                projectsErrors++;
            }
        }
    } catch (error) {
        console.log(error);
        projectsErrors++;
    }
};

let statsErrors = 0;
const seedStats = async () => {
    try {
        const stats = JSON.parse(
            readFileSync("src/seed/json_exports/stats.json").toString(),
        );
        for (const stat of stats) {
            try {
                await prisma.stats.create({
                    data: {
                        totalServiceProviders: stat.totalServiceProviders,
                        totalProjects: stat.totalProjects,
                        totalEvaluationAgents: stat.totalEvaluationAgents,
                        totalClaims: stat.claims.total,
                        successfulClaims: stat.claims.totalSuccessful,
                        submittedClaims: stat.claims.totalSubmitted,
                        pendingClaims: stat.claims.totalPending,
                        rejectedClaims: stat.claims.totalRejected,
                        claimLocations: stat.claims.claimLocations || [""],
                        totalInvestors: 0,
                    },
                });
            } catch (error) {
                console.log(error);
                statsErrors++;
            }
        }
    } catch (error) {
        console.log(error);
        statsErrors++;
    }
};

let transactionsErrors = 0;
const seedTransactions = async () => {
    try {
        const transactions = JSON.parse(
            readFileSync("src/seed/json_exports/transactions.json").toString(),
        );
        for (const transaction of transactions) {
            try {
                const amount = JSON.parse(transaction.amount);
                await prisma.bondBuy.create({
                    data: {
                        bondDid: transaction.bond_did.slice(1, -1),
                        buyerDid: transaction.buyer_did.slice(1, -1),
                        amount: amount.amount,
                        maxPrices: transaction.max_prices,
                        buyerAddress: "",
                    },
                });
            } catch (error) {
                console.log(error);
                transactionsErrors++;
            }
        }
    } catch (error) {
        console.log(error);
        transactionsErrors++;
    }
};

let withdrawreservesErrors = 0;
const seedWithdrawReserves = async () => {
    try {
        const withdrawReserves = JSON.parse(
            readFileSync(
                "src/seed/json_exports/withdrawreserves.json",
            ).toString(),
        );
        for (const withdrawReserve of withdrawReserves) {
            try {
                const rawValue = JSON.parse(withdrawReserve.raw_value);
                await prisma.reserveWithdrawal.create({
                    data: {
                        bondDid: withdrawReserve.bond_did,
                        withdrawerDid: withdrawReserve.withdrawer_did,
                        amount: rawValue.value.amount,
                        height: withdrawReserve.height,
                        timestamp: withdrawReserve.timestamp,
                        withdrawerAddress: "",
                    },
                });
            } catch (error) {
                console.log(error);
                withdrawreservesErrors++;
            }
        }
    } catch (error) {
        console.log(error);
        withdrawreservesErrors++;
    }
};

let withdrawsharesErrors = 0;
const seedWithdrawShares = async () => {
    try {
        const withdrawShares = JSON.parse(
            readFileSync(
                "src/seed/json_exports/withdrawshares.json",
            ).toString(),
        );
        for (const withdrawShare of withdrawShares) {
            try {
                await prisma.shareWithdrawal.create({
                    data: {
                        bondDid: withdrawShare.bond_did,
                        recipientDid: withdrawShare.recipient_did,
                        height: withdrawShare.height,
                        timestamp: withdrawShare.timestamp,
                        recipientAddress: "",
                    },
                });
            } catch (error) {
                console.log(error);
                withdrawsharesErrors++;
            }
        }
    } catch (error) {
        console.log(error);
        withdrawsharesErrors++;
    }
};

const countRecords = async () => {
    try {
        const agents = await prisma.agent.count();
        const alphas = await prisma.alpha.count();
        const bonds = await prisma.bond.count();
        const chains = await prisma.chain.count();
        const dids = await prisma.iID.count();
        const events = await prisma.event.count();
        const paymentoutcomes = await prisma.outcomePayment.count();
        const projects = await prisma.project.count();
        const stats = await prisma.stats.count();
        const transactions = await prisma.bondBuy.count();
        const withdrawreserves = await prisma.reserveWithdrawal.count();
        const withdrawshares = await prisma.shareWithdrawal.count();

        console.log({
            Succeeded: {
                agents,
                alphas,
                bonds,
                chains,
                dids,
                events,
                paymentoutcomes,
                projects,
                stats,
                transactions,
                withdrawreserves,
                withdrawshares,
            },
            Failed: {
                agents: agentsErrors,
                alphas: alphaErrors,
                bonds: bondsErrors,
                chains: chainsErrors,
                dids: didsErrors,
                events: eventsErrors,
                paymentoutcomes: paymentoutcomesErrors,
                projects: projectsErrors,
                stats: statsErrors,
                transactions: transactionsErrors,
                withdrawreserves: withdrawreservesErrors,
                withdrawshares: withdrawsharesErrors,
            },
        });
    } catch (error) {
        console.log(error);
    }
};

// seedAlphas();
// seedBonds();
// seedChains();
// seedDids();
// seedEvents();
// seedPaymentOutcomes();
// seedProjects();
// seedAgents();
// seedStats();
// seedTransactions();
// seedWithdrawReserves();
// seedWithdrawShares();

// countRecords();
