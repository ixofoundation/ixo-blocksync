import { prisma } from "../prisma/prisma_client";

export const listBlockTransactions = async (filter: any) => {
    try {
        if (filter.hasOwnProperty("type") && filter.hasOwnProperty("address")) {
            const res = await prisma.transaction.findMany({
                where: {
                    type: filter.type,
                    from: filter.address,
                },
            });
            return res;
        } else if (filter.hasOwnProperty("type")) {
            const res = await prisma.transaction.findMany({
                where: {
                    type: filter.type,
                },
            });
            return res;
        } else if (filter.hasOwnProperty("address")) {
            const res = await prisma.transaction.findMany({
                where: {
                    from: filter.address,
                },
            });
            return res;
        }
    } catch (error) {
        console.log(error);
        return;
    }
    return;
};
