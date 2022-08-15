import { prisma } from "../prisma_client";
import { IBond, IPriceEntry, NewBondInfo, NumberPriceEntry } from "../interface_models/Bond";
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

export const addPriceEntry = async (bondInfo: NewBondInfo) => {
    let result: any;
    let priceEntryDoc: IPriceEntry;
    let lastPrice = await getLastPrice(bondInfo.did);
    if (!lastPrice) { return; }
    if ("denom" in bondInfo.spotPrice[0]) {
        priceEntryDoc = {
            bondDid: bondInfo.did,
            time: bondInfo.blockTimestamp,
            denom: bondInfo.spotPrice[0].denom,
            price: bondInfo.spotPrice[0].amount,
        };
    } else {
        priceEntryDoc = {
            bondDid: bondInfo.did,
            time: bondInfo.blockTimestamp,
            price: bondInfo.spotPrice[0].amount,
        };
    }
    if (!lastPrice?.price || lastPrice?.price != priceEntryDoc.price) {
        result = await prisma.priceEntry.create({ data: priceEntryDoc });
    }
    return result;
};

export const addInitialPriceEntry = async (bondInfo: NewBondInfo) => {
    let lastPrice = await getLastPrice(bondInfo.did);
    if (!lastPrice) { return; }
    let priceEntryDoc: IPriceEntry = {
        bondDid: bondInfo.did,
        time: bondInfo.blockTimestamp,
        price: 0.000000000000000000,
    };
    return prisma.priceEntry.create({
        data: priceEntryDoc,
    });
};

export const getLastPrice = async (bondDid: string) => {
    const prices = await prisma.priceEntry.findMany({
        where: { bondDid: bondDid },
        select: {
            time: true,
            price: true,
        }
    });
    const lastPriceEntry = prices[prices.length - 1];
    const convertedLastPriceEntry: NumberPriceEntry = {
        time: lastPriceEntry.time,
        price: Number(lastPriceEntry.price),
    };
    return convertedLastPriceEntry;
};

export const listAllBonds = async () => {
    return prisma.bond.findMany();
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
    });
};

export const listBondPriceHistoryByBondDid = async (bondDid: string, reqBody: any) => {
    let fromTime = 0;
    let toTime = (new Date()).getTime();
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