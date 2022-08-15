import { prisma } from "../prisma_client";
import { IBond, IPriceEntry, NewPriceEntry } from "../interface_models/Bond";
import { ITransaction } from "../interface_models/Transaction";
import { IAlphaChange } from "../interface_models/AlphaChange";
import { IShareWithdrawal } from "../interface_models/ShareWithdrawal";
import { IReserveWithdrawal } from "../interface_models/ReserveWithdrawal";
import { IOutcomePayment } from "../interface_models/OutcomePayment";

export const createBond = async (bondDoc: IBond) => {
    return prisma.bond.create({ data: bondDoc });
};

export const createTransaction = async (transactionDoc: ITransaction) => {
    return prisma.transaction.create({ data: transactionDoc });
};

export const createAlphaChange = async (alphaChangeDoc: IAlphaChange) => {
    return prisma.alphaChange.create({ data: alphaChangeDoc });
};

export const createShareWithdrawal = async (shareWithdrawalDoc: IShareWithdrawal) => {
    return prisma.shareWithdrawal.create({ data: shareWithdrawalDoc });
};

export const createReserveWithdrawal = async (reserveWithdrawalDoc: IReserveWithdrawal) => {
    return prisma.reserveWithdrawal.create({ data: reserveWithdrawalDoc });
};

export const createOutcomePayment = async (outcomePaymentDoc: IOutcomePayment) => {
    return prisma.outcomePayment.create({ data: outcomePaymentDoc });
};

export const addPriceEntry = async (newPriceEntryDoc: NewPriceEntry) => {
    let result: any;
    let priceEntryDoc: IPriceEntry;
    let lastPrice = await getLastPrice(newPriceEntryDoc.bondDid);
    if (!lastPrice) { return; }
    if ("denom" in newPriceEntryDoc.price[0]) {
        priceEntryDoc = {
            bondDid: newPriceEntryDoc.bondDid,
            time: newPriceEntryDoc.time,
            denom: newPriceEntryDoc.price[0]["denom"],
            price: newPriceEntryDoc.price[0]["amount"],
        };
    } else {
        priceEntryDoc = {
            bondDid: newPriceEntryDoc.bondDid,
            time: newPriceEntryDoc.time,
            price: newPriceEntryDoc.price[0]["amount"],
        };
    }
    if (!lastPrice?.price || lastPrice?.price != newPriceEntryDoc.price[0]["amount"]) {
        result = await prisma.priceEntry.create({ data: priceEntryDoc });
    }
    return result;
};

export const getLastPrice = async (bondDid: string) => {
    const prices = await prisma.priceEntry.findMany({
        where: { bondDid: bondDid },
        select: {
            time: true,
            price: true,
        }
    });
    return prices[-1];
};

export const listAllBonds = async () => {
    return prisma.bond.findMany({
        select: {
            bondDid: true,
            token: true,
            name: true,
            description: true,
            creatorDid: true,
        },
    });
};

export const listAllBondsFiltered = async (fields: string[]) => {
    let filter = {};
    for (const i in fields) {
        filter[fields[i]] = true;
    };
    return prisma.bond.findMany({
        select: filter,
    });
};

export const listBondByBondDid = async (bondDid: string) => {
    return prisma.bond.findFirst({
        where: { bondDid: bondDid },
        select: {
            bondDid: true,
            token: true,
            name: true,
            description: true,
            creatorDid: true,
        },
    });
};

export const listBondPriceHistoryByBondDid = async (bondDid: string, reqBody: any) => {
    let fromTime = 0;
    let toTime = 8640000000000000;
    if (reqBody.hasOwnProperty("fromTime")) {
        fromTime = parseInt(reqBody.fromTime);
    };
    if (reqBody.hasOwnProperty("toTime")) {
        toTime = parseInt(reqBody.toTime);
    };
    return prisma.priceEntry.findMany({
        where: {
            bondDid: bondDid,
            time: {
                gte: new Date(fromTime),
                lte: new Date(toTime),
            },
        },
        select: {
            time: true,
            denom: true,
            price: true,
        },
    });
};

export const listBondByCreatorDid = async (creatorDid: string) => {
    return prisma.bond.findMany({
        where: { creatorDid: creatorDid },
        select: {
            bondDid: true,
            token: true,
            name: true,
            description: true,
            creatorDid: true,
        },
    });
};

//All functions from here on not implemented in api
export const listAllBondsDids = async () => {
    return prisma.bond.findMany({
        select: {
            bondDid: true,
        },
    });
};

export const getAlphaHistoryByDid = async (bondDid: string) => {
    return prisma.alphaChange.findMany({
        where: { bondDid: bondDid },
    });
};

export const getOutcomeHistoryByDid = async (bondDid: string) => {
    return prisma.outcomePayment.findMany({
        where: { bondDid: bondDid },
    });
};

export const getTransactionHistoryBond = async (bondDid: string) => {
    return prisma.transaction.findMany({
        where: { bondDid: bondDid },
    });
};

export const getTransactionHistoryBondBuyer = async (buyerDid: string) => {
    return prisma.transaction.findMany({
        where: { buyerDid: buyerDid },
    });
};

export const getWithdrawHistoryFromBondReserveByBondDid = async (bondDid: string) => {
    return prisma.reserveWithdrawal.findMany({
        where: { bondDid: bondDid },
    });
};

export const getWithdrawHistoryFromBondShareByBondDid = async (bondDid: string) => {
    return prisma.shareWithdrawal.findMany({
        where: { bondDid: bondDid },
    });
};

export const getWithdrawHistoryFromBondReserveByWithdrawerId = async (withdrawerdid: string) => {
    return prisma.reserveWithdrawal.findMany({
        where: { withdrawerDid: withdrawerdid },
    });
};

export const getWithdrawHistoryFromBondShareByRecipientDid = async (recipientdid: string) => {
    return prisma.shareWithdrawal.findMany({
        where: { recipientDid: recipientdid },
    });
};