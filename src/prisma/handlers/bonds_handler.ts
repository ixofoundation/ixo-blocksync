import { prisma } from "../prisma_client";
import { Prisma } from "@prisma/client";
import { io } from "../server";
import { IBond, IPriceEntry, NewBondInfo } from "../interface_models/Bond";
import { ITransaction } from "../interface_models/Transaction";
import { IAlphaChange } from "../interface_models/AlphaChange";
import { IShareWithdrawal } from "../interface_models/ShareWithdrawal";
import { IReserveWithdrawal } from "../interface_models/ReserveWithdrawal";
import { IOutcomePayment } from "../interface_models/OutcomePayment";

export const createBond = async (bondDoc: IBond) => {
    try {
        const res = await prisma.bond.create({ data: bondDoc });
        io.emit("Bond Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const createTransaction = async (transactionDoc: ITransaction) => {
    try {
        const res = await prisma.transaction.create({ data: transactionDoc });
        io.emit("Transaction Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const createAlphaChange = async (alphaChangeDoc: IAlphaChange) => {
    try {
        const res = await prisma.alphaChange.create({ data: alphaChangeDoc });
        io.emit("Alpha Change Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const createShareWithdrawal = async (shareWithdrawalDoc: IShareWithdrawal) => {
    try {
        const res = await prisma.shareWithdrawal.create({ data: shareWithdrawalDoc });
        io.emit("Share Withdrawal Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const createReserveWithdrawal = async (reserveWithdrawalDoc: IReserveWithdrawal) => {
    try {
        const res = await prisma.reserveWithdrawal.create({ data: reserveWithdrawalDoc });
        io.emit("Reserve Withdrawal Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const createOutcomePayment = async (outcomePaymentDoc: IOutcomePayment) => {
    try {
        const res = await prisma.outcomePayment.create({ data: outcomePaymentDoc });
        io.emit("Outcome Payment Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const getLastPrice = async (bondDid: string) => {
    try {
        const prices = await prisma.priceEntry.findMany({
            where: { bondDid: bondDid },
            select: {
                time: true,
                price: true,
            },
        });
        if (!prices) {
            return;
        };
        const lastPriceEntry = prices[prices.length - 1];
        return lastPriceEntry;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const addPriceEntry = async (bondInfo: NewBondInfo) => {
    try {
        let result: any;
        let lastPrice: any;
        let priceEntryDoc: IPriceEntry;
        lastPrice = await getLastPrice(bondInfo.did);
        if (!lastPrice) {
            //lastPrice = {};
            return;
        };
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
        };
        if (!lastPrice?.price || lastPrice?.price != new Prisma.Decimal(priceEntryDoc.price)) {
            result = await prisma.priceEntry.create({ data: priceEntryDoc });
            io.emit("Price Entry Added", bondInfo.did);
        }
        return result;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const addInitialPriceEntry = async (bondInfo: NewBondInfo) => {
    try {
        const priceEntryDoc: IPriceEntry = {
            bondDid: bondInfo.did,
            time: bondInfo.blockTimestamp,
            price: 0.000000000000000000,
        };
        const res = await prisma.priceEntry.create({
            data: priceEntryDoc,
        });
        io.emit("Initial Price Entry Added", bondInfo.did);
        return res;
    } catch (error) {
        console.log(error);
        return;
    };
};

export const listAllBonds = async () => {
    const res = await prisma.bond.findMany();
    io.emit("List all Bonds", res);
    return res;
};

export const listAllBondsFiltered = async (fields: string[]) => {
    let filter = {};
    for (let i in fields) {
        filter[fields[i]] = true;
    };
    const res = await prisma.bond.findMany({
        select: filter,
    });
    io.emit("List Specified Fields of all Bonds", res);
    return res;
};

export const listBondByBondDid = async (bondDid: string) => {
    const res = await prisma.bond.findFirst({
        where: { bondDid: bondDid },
    });
    io.emit("List Bond by DID", res);
    return res;
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
    const res = await prisma.priceEntry.findMany({
        where: {
            bondDid: bondDid,
            time: {
                gte: new Date(fromTime),
                lte: new Date(toTime),
            },
        },
        select: {
            price: true,
        },
    });
    io.emit("List Bond Price History by DID", res);
    return res;
};

export const listBondByCreatorDid = async (creatorDid: string) => {
    return prisma.bond.findMany({
        where: { creatorDid: creatorDid },
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