import { prisma } from "../prisma/prisma_client";

export const listBlockTransactions = async (filter?: any) => {
    let res: any;
    if (filter) {
        if (filter.type && filter.address) {
            res = await prisma.blockTransaction.findMany({
                where: {
                    AND: [
                        {
                            msg: {
                                path: ["type"],
                                equals: filter.type,
                            }
                        },
                        {
                            msg: {
                                path: ["value"]["from_address"],
                                equals: filter.address,
                            },
                        },
                    ],
                },
            });
        } else if (filter.type) {
            res = await prisma.blockTransaction.findMany({
                where: {
                    msg: {
                        path: ["type"],
                        equals: filter.type
                    }
                },
            });
        } else if (filter.address) {
            res = await prisma.blockTransaction.findMany({
                where: {
                    msg: {
                        path: ["type"],
                        equals: filter.type
                    }
                },
            });
        };
    } else {
        res = await prisma.blockTransaction.findMany();
    };
    return res;
};