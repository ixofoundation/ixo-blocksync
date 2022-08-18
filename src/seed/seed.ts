import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/prisma_client";
import * as bonds from "./json_exports/bonds.json";
import * as alphachanges from "./json_exports/alphas.json";
import * as transactions from "./json_exports/transactions.json";
import * as reservewithdrawals from "./json_exports/withdrawreserves.json";
import * as sharewithdrawals from "./json_exports/withdrawshares.json";
import * as outcomepayments from "./json_exports/paymentoutcomes.json";
import * as chains from "./json_exports/chains.json";
import * as dids from "./json_exports/dids.json";
// import * as events from "./json_exports/events.json";
import * as projects from "./json_exports/projects.json";
import * as stats from "./json_exports/stats.json";

const resetAll = async () => {
    await prisma.agent.deleteMany();
    await prisma.claim.deleteMany();
    await prisma.project.deleteMany();
    await prisma.priceEntry.deleteMany();
    await prisma.alphaChange.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.shareWithdrawal.deleteMany();
    await prisma.reserveWithdrawal.deleteMany();
    await prisma.outcomePayment.deleteMany();
    await prisma.bond.deleteMany();
    await prisma.chain.deleteMany();
    await prisma.credential.deleteMany();
    await prisma.dID.deleteMany();
    await prisma.event.deleteMany();
    await prisma.stat.deleteMany();
};
// resetAll();

const seedBonds = async () => {
    bonds.forEach(async bond => {
        await prisma.bond.upsert({
            where: {
                bondDid: bond.did
            },
            update: {},
            create: {
                bondDid: bond.did,
                token: bond.token,
                name: bond.name,
                description: bond.description,
                creatorDid: bond.creatorDid,
            },
        });
        bond.priceHistory.forEach(async priceEntry => {
            await prisma.priceEntry.create({
                data: {
                    bondDid: bond.did,
                    time: new Date(parseInt(priceEntry["time"]["$date"]["$numberLong"])),
                    price: new Prisma.Decimal(priceEntry.price),
                },
            });
        });
    });
};

const seedAlphaChanges = async () => {
    alphachanges.forEach(async alphachange => {
        const bondExists = await prisma.bond.findFirst({
            where: {
                bondDid: alphachange.bond_did,
            },
        });
        if (bondExists) {
            await prisma.alphaChange.create({
                data: {
                    bondDid: alphachange.bond_did,
                    rawValue: alphachange.raw_value,
                    height: alphachange.height,
                    timestamp: alphachange.timestamp,
                },
            });
        };
    });
};

const seedTransactions = async () => {
    transactions.forEach(async transaction => {
        const bondExists = await prisma.bond.findFirst({
            where: {
                bondDid: transaction.bond_did,
            },
        });
        if (bondExists) {
            await prisma.transaction.create({
                data: {
                    bondDid: transaction.bond_did,
                    buyerDid: transaction.buyer_did,
                    amount: transaction.amount,
                    maxPrices: transaction.max_prices,
                },
            });
        };
    });
};

const seedShareWithdrawals = async () => {
    sharewithdrawals.forEach(async sharewithdrawal => {
        const bondExists = await prisma.bond.findFirst({
            where: {
                bondDid: sharewithdrawal.bond_did,
            },
        });
        if (bondExists) {
            await prisma.shareWithdrawal.create({
                data: {
                    bondDid: sharewithdrawal.bond_did,
                    rawValue: sharewithdrawal.raw_value,
                    transaction: sharewithdrawal.transaction,
                    recipientDid: sharewithdrawal.recipient_did,
                    height: sharewithdrawal.height,
                    timestamp: sharewithdrawal.timestamp,
                },
            });
        };
    });
};

const seedReserveWithdrawals = async () => {
    reservewithdrawals.forEach(async reservewithdrawal => {
        const bondExists = await prisma.bond.findFirst({
            where: {
                bondDid: reservewithdrawal.bond_did,
            },
        })
        if (bondExists) {
            await prisma.reserveWithdrawal.create({
                data: {
                    bondDid: reservewithdrawal.bond_did,
                    rawValue: reservewithdrawal.raw_value,
                    transaction: reservewithdrawal.transaction,
                    withdrawerDid: reservewithdrawal.withdrawer_did,
                    height: reservewithdrawal.height,
                    timestamp: reservewithdrawal.timestamp,
                },
            });
        };
    });
};

const seedOutcomePayments = async () => {
    outcomepayments.forEach(async outcomepayment => {
        const bondExists = await prisma.bond.findFirst({
            where: {
                bondDid: outcomepayment.bond_did,
            },
        });
        if (bondExists) {
            await prisma.outcomePayment.create({
                data: {
                    bondDid: outcomepayment.bond_did,
                    rawValue: outcomepayment.raw_value,
                    senderDid: outcomepayment.sender_did,
                    amount: outcomepayment.amount,
                    height: outcomepayment.height,
                    timestamp: outcomepayment.timestamp,
                },
            });
        };
    });
};

const seedChains = async () => {
    chains.forEach(async chain => {
        await prisma.chain.create({
            data: {
                chainId: chain.chainId,
                blockHeight: chain.blockHeight,
            },
        });
    });
};

const seedDIDs = async () => {
    dids.forEach(async did => {
        await prisma.dID.upsert({
            where: {
                did: did.did,
            },
            update: {},
            create: {
                did: did.did,
                publicKey: did.publicKey,
            },
        });
        if (did.credentials !== []) {
            did.credentials.forEach(async credential => {
                await prisma.credential.create({
                    data: {
                        did: did.did,
                        claimId: credential.claim.id,
                        claimKyc: credential.claim.KYCValidated,
                        issuer: credential.issuer,
                    },
                });
            });
        };
    });
};

// const seedEvents = async () => {
//     for (const event in events) {
//         if (Object.prototype.hasOwnProperty.call(events, event)) {
//             const element = events[event];
//             console.log(element);
//         };
//         break;
//     };
// };

const seedProjects = async () => {
    for (const project in projects) {
        if (Object.prototype.hasOwnProperty.call(projects, project)) {
            const element = projects[project];
            console.log(element);
        };
        break;
    };
};

const seedStats = async () => {
    stats.forEach(async stat => {
        await prisma.stat.create({
            data: {
                totalServiceProviders: stat.totalServiceProviders,
                totalProjects: stat.totalProjects,
                totalEvaluationAgents: stat.totalEvaluationAgents,
                totalInvestors: 0,
                totalClaims: stat.claims.total,
                successfulClaims: stat.claims.totalSuccessful,
                submittedClaims: stat.claims.totalSubmitted,
                pendingClaims: stat.claims.totalPending,
                rejectedClaims: stat.claims.totalRejected,
                claimLocations: stat.claims.claimLocations,
            },
        });
    });
};

const seedAll = async () => {
    await seedBonds();
    await seedAlphaChanges();
    await seedTransactions();
    await seedShareWithdrawals();
    await seedReserveWithdrawals();
    await seedOutcomePayments();
    await seedChains();
    await seedDIDs();
    await seedStats();
    // await seedProjects();
    // await seedEvents();
};
// seedAll();