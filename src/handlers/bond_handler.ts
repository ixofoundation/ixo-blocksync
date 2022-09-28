import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";
import { io } from "../server";

export const createBond = async (bondDoc: Prisma.BondCreateInput) => {
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
            orderBy: {
                id: "desc",
            },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createPriceEntry = async (
    priceEntryDoc: Prisma.PriceEntryUncheckedCreateInput,
) => {
    try {
        const res = await prisma.priceEntry.create({ data: priceEntryDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createTransaction = async (
    bondBuyDoc: Prisma.BondBuyUncheckedCreateInput,
) => {
    try {
        const res = await prisma.bondBuy.create({ data: bondBuyDoc });
        io.emit("Transaction Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createAlphaChange = async (
    alphaChangeDoc: Prisma.AlphaChangeUncheckedCreateInput,
) => {
    try {
        const res = await prisma.alphaChange.create({ data: alphaChangeDoc });
        io.emit("Alpha Change Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createShareWithdrawal = async (
    shareWithdrawalDoc: Prisma.ShareWithdrawalUncheckedCreateInput,
) => {
    try {
        const res = await prisma.shareWithdrawal.create({
            data: shareWithdrawalDoc,
        });
        io.emit("Share Withdrawal Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createReserveWithdrawal = async (
    reserveWithdrawalDoc: Prisma.ReserveWithdrawalUncheckedCreateInput,
) => {
    try {
        const res = await prisma.reserveWithdrawal.create({
            data: reserveWithdrawalDoc,
        });
        io.emit("Reserve Withdrawal Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createOutcomePayment = async (
    outcomePaymentDoc: Prisma.OutcomePaymentUncheckedCreateInput,
) => {
    try {
        const res = await prisma.outcomePayment.create({
            data: outcomePaymentDoc,
        });
        io.emit("Outcome Payment Created", res);
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const listAllBonds = async (page: string, size: string) => {
    const res = await prisma.bond.findMany({
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
    io.emit("List all Bonds", res);
    return res;
};

export const listAllBondsFiltered = async (
    fields: string[],
    page: string,
    size: string,
) => {
    let filter = {};
    for (let i in fields) {
        filter[fields[i]] = true;
    }
    const res = await prisma.bond.findMany({
        select: filter,
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
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
    page: string,
    size: string,
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
            time: true,
            price: true,
        },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
    io.emit("List Bond Price History by DID", res);
    return res;
};

export const listBondByCreatorDid = async (
    creatorDid: string,
    page: string,
    size: string,
) => {
    return prisma.bond.findMany({
        where: { creatorDid: creatorDid },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
};

export const getOutcomeHistoryByDid = async (
    bondDid: string,
    page: string,
    size: string,
) => {
    return prisma.outcomePayment.findMany({
        where: { bondDid: bondDid },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
};

export const getAlphaHistoryByDid = async (
    bondDid: string,
    page: string,
    size: string,
) => {
    return prisma.alphaChange.findMany({
        where: { bondDid: bondDid },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
};

export const getTransactionHistoryBond = async (
    bondDid: string,
    page: string,
    size: string,
) => {
    return prisma.bondBuy.findMany({
        where: { bondDid: bondDid },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
};

export const getTransactionHistoryBondBuyer = async (
    buyerDid: string,
    page: string,
    size: string,
) => {
    return prisma.bondBuy.findMany({
        where: { buyerDid: buyerDid },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
};

export const getWithdrawHistoryFromBondReserveByBondDid = async (
    bondDid: string,
    page: string,
    size: string,
) => {
    return prisma.reserveWithdrawal.findMany({
        where: { bondDid: bondDid },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
};

export const getWithdrawHistoryFromBondShareByBondDid = async (
    bondDid: string,
    page: string,
    size: string,
) => {
    return prisma.shareWithdrawal.findMany({
        where: { bondDid: bondDid },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
};

export const getWithdrawHistoryFromBondReserveByWithdrawerId = async (
    withdrawerdid: string,
    page: string,
    size: string,
) => {
    return prisma.reserveWithdrawal.findMany({
        where: { withdrawerDid: withdrawerdid },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
};

export const getWithdrawHistoryFromBondShareByRecipientDid = async (
    recipientdid: string,
    page: string,
    size: string,
) => {
    return prisma.shareWithdrawal.findMany({
        where: { recipientDid: recipientdid },
        skip: Number(size) * (Number(page) - 1),
        take: Number(size),
    });
};
