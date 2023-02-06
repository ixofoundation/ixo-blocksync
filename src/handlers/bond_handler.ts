import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";

const prefixes = ["did:x:", "did:ixo:", "did:sov:"];

export const createBond = async (bondDoc: Prisma.BondCreateInput) => {
    try {
        const res = await prisma.bond.create({ data: bondDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const editBond = async (bondDoc: Prisma.BondUpdateInput) => {
    try {
        return prisma.bond.update({
            where: {
                bondDid: String(bondDoc.bondDid),
            },
            data: {
                name: bondDoc.name,
                description: bondDoc.description,
                orderQuantityLimits: bondDoc.orderQuantityLimits,
                sanityRate: bondDoc.sanityRate,
                sanityMarginPercentage: bondDoc.sanityMarginPercentage,
                editorDid: bondDoc.editorDid,
                editorAddress: bondDoc.editorAddress,
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateBondState = async (bondDoc: Prisma.BondUpdateInput) => {
    try {
        return prisma.bond.update({
            where: {
                bondDid: String(bondDoc.bondDid),
            },
            data: {
                status: bondDoc.status,
                editorDid: bondDoc.editorDid,
                editorAddress: bondDoc.editorAddress,
            },
        });
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

export const createBuy = async (
    bondBuyDoc: Prisma.BondBuyUncheckedCreateInput,
) => {
    try {
        const res = await prisma.bondBuy.create({ data: bondBuyDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createSell = async (
    bondSellDoc: Prisma.BondSellUncheckedCreateInput,
) => {
    try {
        return prisma.bondSell.create({ data: bondSellDoc });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createSwap = async (
    bondSwapDoc: Prisma.BondSwapUncheckedCreateInput,
) => {
    try {
        return prisma.bondSwap.create({ data: bondSwapDoc });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const createAlpha = async (
    alphaDoc: Prisma.AlphaUncheckedCreateInput,
) => {
    try {
        const res = await prisma.alpha.create({ data: alphaDoc });
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
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const listAllBonds = async (page?: string, size?: string) => {
    if (page && size) {
        return prisma.bond.findMany({
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.bond.findMany();
    }
};

export const listAllBondsFiltered = async (
    fields: string[],
    page?: string,
    size?: string,
) => {
    let filter = {};
    for (let i in fields) {
        filter[fields[i]] = true;
    }
    if (page && size) {
        return prisma.bond.findMany({
            select: filter,
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.bond.findMany({ select: filter });
    }
};

export const listBondByBondDid = async (bondDid: string) => {
    return prisma.bond.findFirst({
        where: {
            OR: [
                { bondDid: prefixes[0] + bondDid },
                { bondDid: prefixes[1] + bondDid },
                { bondDid: prefixes[2] + bondDid },
            ],
        },
    });
};

export const listBondPriceHistoryByBondDid = async (
    bondDid: string,
    reqBody: any,
    page?: string,
    size?: string,
) => {
    let fromTime = 0;
    let toTime = new Date().getTime();
    if (reqBody.hasOwnProperty("fromTime")) {
        fromTime = parseInt(reqBody.fromTime);
    }
    if (reqBody.hasOwnProperty("toTime")) {
        toTime = parseInt(reqBody.toTime);
    }
    if (page && size) {
        return prisma.priceEntry.findMany({
            where: {
                OR: [
                    { bondDid: prefixes[0] + bondDid },
                    { bondDid: prefixes[1] + bondDid },
                    { bondDid: prefixes[2] + bondDid },
                ],
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
    } else {
        return prisma.priceEntry.findMany({
            where: {
                OR: [
                    { bondDid: prefixes[0] + bondDid },
                    { bondDid: prefixes[1] + bondDid },
                    { bondDid: prefixes[2] + bondDid },
                ],
                time: {
                    gte: new Date(fromTime),
                    lte: new Date(toTime),
                },
            },
            select: {
                time: true,
                price: true,
            },
        });
    }
};

export const listBondByCreatorDid = async (
    creatorDid: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.bond.findMany({
            where: {
                OR: [
                    { creatorDid: prefixes[0] + creatorDid },
                    { creatorDid: prefixes[1] + creatorDid },
                    { creatorDid: prefixes[2] + creatorDid },
                ],
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.bond.findMany({
            where: {
                OR: [
                    { creatorDid: prefixes[0] + creatorDid },
                    { creatorDid: prefixes[1] + creatorDid },
                    { creatorDid: prefixes[2] + creatorDid },
                ],
            },
        });
    }
};

export const getOutcomeHistoryByDid = async (
    bondDid: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.outcomePayment.findMany({
            where: {
                OR: [
                    { bondDid: prefixes[0] + bondDid },
                    { bondDid: prefixes[1] + bondDid },
                    { bondDid: prefixes[2] + bondDid },
                ],
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.outcomePayment.findMany({
            where: {
                OR: [
                    { bondDid: prefixes[0] + bondDid },
                    { bondDid: prefixes[1] + bondDid },
                    { bondDid: prefixes[2] + bondDid },
                ],
            },
        });
    }
};

export const getAlphaHistoryByDid = async (
    bondDid: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.alpha.findMany({
            where: {
                OR: [
                    { bondDid: prefixes[0] + bondDid },
                    { bondDid: prefixes[1] + bondDid },
                    { bondDid: prefixes[2] + bondDid },
                ],
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.alpha.findMany({
            where: {
                OR: [
                    { bondDid: prefixes[0] + bondDid },
                    { bondDid: prefixes[1] + bondDid },
                    { bondDid: prefixes[2] + bondDid },
                ],
            },
        });
    }
};

export const getTransactionHistoryBond = async (
    bondDid: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.bondBuy.findMany({
            where: {
                OR: [
                    { bondDid: prefixes[0] + bondDid },
                    { bondDid: prefixes[1] + bondDid },
                    { bondDid: prefixes[2] + bondDid },
                ],
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.bondBuy.findMany({
            where: {
                OR: [
                    { bondDid: prefixes[0] + bondDid },
                    { bondDid: prefixes[1] + bondDid },
                    { bondDid: prefixes[2] + bondDid },
                ],
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    }
};

export const getTransactionHistoryBondBuyer = async (
    buyerDid: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.bondBuy.findMany({
            where: {
                OR: [
                    { buyerDid: prefixes[0] + buyerDid },
                    { buyerDid: prefixes[1] + buyerDid },
                    { buyerDid: prefixes[2] + buyerDid },
                ],
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.bondBuy.findMany({
            where: {
                OR: [
                    { buyerDid: prefixes[0] + buyerDid },
                    { buyerDid: prefixes[1] + buyerDid },
                    { buyerDid: prefixes[2] + buyerDid },
                ],
            },
        });
    }
};

export const getWithdrawHistoryFromBondReserveByBondDid = async (
    bondDid: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.reserveWithdrawal.findMany({
            where: {
                OR: [
                    { bondDid: prefixes[0] + bondDid },
                    { bondDid: prefixes[1] + bondDid },
                    { bondDid: prefixes[2] + bondDid },
                ],
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.reserveWithdrawal.findMany({
            where: {
                OR: [
                    { bondDid: prefixes[0] + bondDid },
                    { bondDid: prefixes[1] + bondDid },
                    { bondDid: prefixes[2] + bondDid },
                ],
            },
        });
    }
};

export const getWithdrawHistoryFromBondShareByBondDid = async (
    bondDid: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.shareWithdrawal.findMany({
            where: {
                OR: [
                    { bondDid: prefixes[0] + bondDid },
                    { bondDid: prefixes[1] + bondDid },
                    { bondDid: prefixes[2] + bondDid },
                ],
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.shareWithdrawal.findMany({
            where: {
                OR: [
                    { bondDid: prefixes[0] + bondDid },
                    { bondDid: prefixes[1] + bondDid },
                    { bondDid: prefixes[2] + bondDid },
                ],
            },
        });
    }
};

export const getWithdrawHistoryFromBondReserveByWithdrawerId = async (
    withdrawerdid: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.reserveWithdrawal.findMany({
            where: {
                OR: [
                    { withdrawerDid: prefixes[0] + withdrawerdid },
                    { withdrawerDid: prefixes[1] + withdrawerdid },
                    { withdrawerDid: prefixes[2] + withdrawerdid },
                ],
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.reserveWithdrawal.findMany({
            where: {
                OR: [
                    { withdrawerDid: prefixes[0] + withdrawerdid },
                    { withdrawerDid: prefixes[1] + withdrawerdid },
                    { withdrawerDid: prefixes[2] + withdrawerdid },
                ],
            },
        });
    }
};

export const getWithdrawHistoryFromBondShareByRecipientDid = async (
    recipientdid: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.shareWithdrawal.findMany({
            where: {
                OR: [
                    { recipientDid: prefixes[0] + recipientdid },
                    { recipientDid: prefixes[1] + recipientdid },
                    { recipientDid: prefixes[2] + recipientdid },
                ],
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.shareWithdrawal.findMany({
            where: {
                OR: [
                    { recipientDid: prefixes[0] + recipientdid },
                    { recipientDid: prefixes[1] + recipientdid },
                    { recipientDid: prefixes[2] + recipientdid },
                ],
            },
        });
    }
};
