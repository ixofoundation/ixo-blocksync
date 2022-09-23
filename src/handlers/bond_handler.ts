import { prisma } from "../prisma/prisma_client";
import { Bond } from "@prisma/client";
import { io } from "../server";
import { createError } from "../util/error";

export const createBond = async (bondDoc: Bond) => {
    try {
        const res = await prisma.bond.create({ data: bondDoc });
        io.emit("Bond Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getLastPrice = async (bondDid: string) => {
    try {
        const res = await prisma.priceEntry.findFirst({
            where: { bondDid: bondDid },
            take: -1,
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createPriceEntry = async (priceEntryDoc: any) => {
    try {
        const res = await prisma.priceEntry.create({ data: priceEntryDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createTransaction = async (bondBuyDoc: any) => {
    try {
        const res = await prisma.bondBuy.create({ data: bondBuyDoc });
        io.emit("Transaction Created", res);
        return res;
    } catch (error) {
        await createError({ type: "bonds/MsgBuy", error: String(error) });
        console.log(error);
        return;
    }
};

export const createAlphaChange = async (alphaChangeDoc: any) => {
    try {
        const res = await prisma.alphaChange.create({ data: alphaChangeDoc });
        io.emit("Alpha Change Created", res);
        return res;
    } catch (error) {
        await createError({
            type: "bonds/MsgSetNextAlpha",
            error: String(error),
        });
        console.log(error);
        return;
    }
};

export const createShareWithdrawal = async (shareWithdrawalDoc: any) => {
    try {
        const res = await prisma.shareWithdrawal.create({
            data: shareWithdrawalDoc,
        });
        io.emit("Share Withdrawal Created", res);
        return res;
    } catch (error) {
        await createError({
            type: "bonds/MsgWithdrawShare",
            error: String(error),
        });
        console.log(error);
        return;
    }
};

export const createReserveWithdrawal = async (reserveWithdrawalDoc: any) => {
    try {
        const res = await prisma.reserveWithdrawal.create({
            data: reserveWithdrawalDoc,
        });
        io.emit("Reserve Withdrawal Created", res);
        return res;
    } catch (error) {
        await createError({
            type: "bonds/MsgWithdrawReserve",
            error: String(error),
        });
        console.log(error);
        return;
    }
};

export const createOutcomePayment = async (outcomePaymentDoc: any) => {
    try {
        const res = await prisma.outcomePayment.create({
            data: outcomePaymentDoc,
        });
        io.emit("Outcome Payment Created", res);
        return res;
    } catch (error) {
        await createError({
            type: "bonds/MsgMakeOutcomePayment",
            error: String(error),
        });
        console.log(error);
        return;
    }
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
    }
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

export const listBondPriceHistoryByBondDid = async (
    bondDid: string,
    reqBody: any,
) => {
    let fromTime = 0;
    let toTime = new Date().getTime();
    if (reqBody.hasOwnProperty("fromTime")) {
        fromTime = parseInt(reqBody.fromTime);
    }
    if (reqBody.hasOwnProperty("toTime")) {
        toTime = parseInt(reqBody.toTime);
    }
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
    return prisma.bondBuy.findMany({
        where: { bondDid: bondDid },
    });
};

export const getTransactionHistoryBondBuyer = async (buyerDid: string) => {
    return prisma.bondBuy.findMany({
        where: { buyerDid: buyerDid },
    });
};

export const getWithdrawHistoryFromBondReserveByBondDid = async (
    bondDid: string,
) => {
    return prisma.reserveWithdrawal.findMany({
        where: { bondDid: bondDid },
    });
};

export const getWithdrawHistoryFromBondShareByBondDid = async (
    bondDid: string,
) => {
    return prisma.shareWithdrawal.findMany({
        where: { bondDid: bondDid },
    });
};

export const getWithdrawHistoryFromBondReserveByWithdrawerId = async (
    withdrawerdid: string,
) => {
    return prisma.reserveWithdrawal.findMany({
        where: { withdrawerDid: withdrawerdid },
    });
};

export const getWithdrawHistoryFromBondShareByRecipientDid = async (
    recipientdid: string,
) => {
    return prisma.shareWithdrawal.findMany({
        where: { recipientDid: recipientdid },
    });
};
