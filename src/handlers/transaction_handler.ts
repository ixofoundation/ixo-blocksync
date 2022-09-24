import { prisma } from "../prisma/prisma_client";

export const listBlockTransactions = async (filter?: any) => {
    let res: any;
    if (filter) {
        if (filter.hasOwnProperty("type") && filter.hasOwnProperty("address")) {
            res = await prisma.transaction.findMany({
                where: {
                    type: filter.type,
                    from: filter.address,
                },
            });
        } else if (filter.hasOwnProperty("type")) {
            res = await prisma.transaction.findMany({
                where: {
                    type: filter.type,
                },
            });
        } else if (filter.hasOwnProperty("address")) {
            res = await prisma.transaction.findMany({
                where: {
                    from: filter.address,
                },
            });
        }
    } else {
        res = await prisma.transaction.findMany({ take: -10 });
    }
    return res;
};
