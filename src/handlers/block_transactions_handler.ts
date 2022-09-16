import { prisma } from "../prisma/prisma_client";

export const listBlockTransactions = async (filter?: any) => {
    let res: any;
    if (filter) {
        if (filter.type && filter.address) {
            res = await prisma.blockTransaction.findMany({
                where: {
                    type: filter.type,
                    from: filter.address,
                },
            });
        } else if (filter.type) {
            res = await prisma.blockTransaction.findMany({
                where: {
                    type: filter.type,
                },
            });
        } else if (filter.address) {
            res = await prisma.blockTransaction.findMany({
                where: {
                    from: filter.address,
                },
            });
        }
    } else {
        res = await prisma.blockTransaction.findMany();
    }
    return res;
};
