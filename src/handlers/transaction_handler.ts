import {
    MsgMintToken,
    MsgRetireToken,
    MsgTransferToken,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/token/v1beta1/tx";
import { parseJson, prisma } from "../prisma/prisma_client";
import { getTokenById } from "./token_handler";

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
                        { typeUrl: "/ixo.token.v1beta1.MsgTransferToken" },
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

export const getTokenTransactions = async (address: string) => {
    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { from: address },
                { to: address },
                {
                    OR: [
                        { typeUrl: "/ixo.token.v1beta1.MsgMintToken" },
                        { typeUrl: "/ixo.token.v1beta1.MsgRetireToken" },
                        { typeUrl: "/ixo.token.v1beta1.MsgTransferToken" },
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
        include: {
            Transaction: true,
        },
    });
    const transactions: any[] = [];
    for (const message of messages) {
        switch (message.typeUrl) {
            case "/ixo.token.v1beta1.MsgMintToken":
                const mintValue: MsgMintToken = parseJson(message.value);
                for (const token of mintValue.mintBatch) {
                    transactions.push({
                        type: "mint",
                        time: message.Transaction.time.toUTCString(),
                        owner: mintValue.owner,
                        amount: token.amount,
                        name: token.name,
                        nftCollection: token.collection,
                        nftEntity: token.tokenData[0].id,
                    });
                }
                break;
            case "/ixo.token.v1beta1.MsgRetireToken":
                const retireValue: MsgRetireToken = parseJson(message.value);
                for (const token of retireValue.tokens) {
                    const tokenRecord = await getTokenById(token.id);
                    transactions.push({
                        type: "retire",
                        time: message.Transaction.time.toUTCString(),
                        owner: retireValue.owner,
                        amount: token.amount,
                        name: tokenRecord!.name,
                        nftCollection: tokenRecord!.collection,
                        nftEntity: tokenRecord!.tokenData[0].id,
                    });
                }
                break;
            case "/ixo.token.v1beta1.MsgTransferToken":
                const transferValue: MsgTransferToken = parseJson(
                    message.value,
                );
                for (const token of transferValue.tokens) {
                    const tokenRecord = await getTokenById(token.id);
                    transactions.push({
                        type: "transfer",
                        time: message.Transaction.time.toUTCString(),
                        from: transferValue.owner,
                        to: transferValue.recipient,
                        amount: token.amount,
                        name: tokenRecord!.name,
                    });
                }
                break;
        }
    }
    return transactions;
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
