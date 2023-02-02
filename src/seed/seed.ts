import { readFileSync } from "fs";
import { prisma } from "../prisma/prisma_client";
import { Decimal } from "@prisma/client/runtime";
import { getIid } from "../util/proto";

const alphas = JSON.parse(
    readFileSync("src/seed/json_exports/alphas.json").toString(),
);
const bonds = JSON.parse(
    readFileSync("src/seed/json_exports/bonds.json").toString(),
);
const chains = JSON.parse(
    readFileSync("src/seed/json_exports/chains.json").toString(),
);
const dids = JSON.parse(
    readFileSync("src/seed/json_exports/dids.json").toString(),
);
const events = JSON.parse(
    readFileSync("src/seed/json_exports/events.json").toString(),
);
const paymentOutcomes = JSON.parse(
    readFileSync("src/seed/json_exports/paymentoutcomes.json").toString(),
);
const projects = JSON.parse(
    readFileSync("src/seed/json_exports/projects.json").toString(),
);
const stats = JSON.parse(
    readFileSync("src/seed/json_exports/stats.json").toString(),
);
const transactions = JSON.parse(
    readFileSync("src/seed/json_exports/transactions.json").toString(),
);
const withdrawReserves = JSON.parse(
    readFileSync("src/seed/json_exports/withdrawreserves.json").toString(),
);
const withdrawShares = JSON.parse(
    readFileSync("src/seed/json_exports/withdrawshares.json").toString(),
);

const seedAlphas = async () => {
    try {
        for (const alpha of alphas) {
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
        }
    } catch (error) {
        console.log(error);
    }
};

const seedBonds = async () => {
    try {
        for (const bond of bonds) {
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
                        time: new Date(priceEntry.time.$date.$numberLong),
                        denom: "",
                        price: new Decimal(priceEntry.price),
                    },
                });
            }
        }
    } catch (error) {
        console.log(error);
    }
};

const seedChains = async () => {
    try {
        for (const chain of chains) {
            await prisma.chain.create({
                data: {
                    chainId: chain.chainId,
                    blockHeight: chain.blockHeight,
                },
            });
        }
    } catch (error) {
        console.log(error);
    }
};

const seedDids = async () => {
    try {
        for (const did of dids) {
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
        }
    } catch (error) {
        console.log(error);
    }
};

const seedEvents = async () => {
    try {
        for (const event of events) {
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
        }
    } catch (error) {
        console.log(error);
    }
};

const seedPaymentOutcomes = async () => {
    try {
        for (const paymentOutcome of paymentOutcomes) {
            const rawValue = JSON.parse(paymentOutcome.raw_value);
            await prisma.outcomePayment.create({
                data: {
                    bondDid: paymentOutcome.bond_did,
                    senderDid: paymentOutcome.sender_did,
                    amount: rawValue.msg[0].value.amount,
                    height: paymentOutcome.height,
                    timestamp: paymentOutcome.timestamp,
                    senderAddress: "",
                },
            });
        }
    } catch (error) {
        console.log(error);
    }
};

const seedProjects = async () => {
    try {
        projects.forEach(async (project) => {
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
                            Number(project.data.createdOn.$date.$numberLong),
                        ) || new Date(),
                    createdBy: project.data.createdBy,
                    successfulClaims: project.data.claimStats.currentSuccessful,
                    rejectedClaims: project.data.claimStats.currentRejected,
                    evaluators: project.data.agentStats.evaluators,
                    evaluatorsPending:
                        project.data.agentStats.evaluatorsPending,
                    serviceProviders: project.data.agentStats.serviceProviders,
                    serviceProvidersPending:
                        project.data.agentStats.serviceProvidersPending,
                    investors: project.data.agentStats.investors,
                    investorsPending: project.data.agentStats.investorsPending,
                },
            });
        });
    } catch (error) {
        console.log(error);
    }
};

const seedStats = async () => {
    try {
        for (const stat of stats) {
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
        }
    } catch (error) {
        console.log(error);
    }
};

const seedTransactions = async () => {
    try {
        for (const transaction of transactions) {
            const amount = JSON.parse(transaction.amount);
            await prisma.bondBuy.create({
                data: {
                    bondDid: transaction.bond_did,
                    buyerDid: transaction.buyer_did,
                    amount: amount.amount,
                    maxPrices: transaction.max_prices,
                    buyerAddress: "",
                },
            });
        }
    } catch (error) {
        console.log(error);
    }
};

const seedWithdrawReserves = async () => {
    try {
        for (const withdrawReserve of withdrawReserves) {
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
        }
    } catch (error) {
        console.log(error);
    }
};

const seedWithdrawShares = async () => {
    try {
        for (const withdrawShare of withdrawShares) {
            await prisma.shareWithdrawal.create({
                data: {
                    bondDid: withdrawShare.bond_did,
                    recipientDid: withdrawShare.recipient_did,
                    height: withdrawShare.height,
                    timestamp: withdrawShare.timestamp,
                    recipientAddress: "",
                },
            });
        }
    } catch (error) {
        console.log(error);
    }
};

// seedAlphas()
// seedBonds()
// seedChains()
// seedDids()
// seedEvents()
// seedPaymentOutcomes()
// seedProjects()
// seedStats()
// seedTransactions()
// seedWithdrawReserves()
// seedWithdrawShares()
