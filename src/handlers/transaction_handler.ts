import { prisma } from "../prisma/prisma_client";

export const getLatestTransactions = async (address: string) => {
    return prisma.message.findMany({
        where: {
            AND: [
                {
                    OR: [{ from: address }, { to: address }],
                },
                {
                    OR: [
                        { typeUrl: "/cosmos.bank.v1beta1.MsgSend" },
                        { typeUrl: "/ixo.entity.v1beta1.MsgTransferEntity" },
                        { typeUrl: "/ixo.token.v1beta1.MsgMintToken" },
                        { typeUrl: "/ixo.token.v1beta1.MsgRetireToken" },
                    ],
                },
            ],
            Transaction: {
                code: 0,
            },
        },
        orderBy: {
            id: "desc",
        },
        take: 3,
        include: {
            Transaction: true,
        },
    });
};

export const listTransactionsByType = async (
    type: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.message.findMany({
            where: { typeUrl: type },
            include: {
                Transaction: true,
            },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.message.findMany({
            where: { typeUrl: type },
            include: {
                Transaction: true,
            },
        });
    }
};
