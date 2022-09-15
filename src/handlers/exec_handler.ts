import { prisma } from "../prisma/prisma_client";

export const createExecMsg = async (execDoc: any) => {
    try {
        const res = await prisma.execMsg.create({
            data: {
                sender: execDoc.sender,
                address: execDoc.address,
                funds: execDoc.funds ? execDoc.funds : {},
                json: execDoc.json ? execDoc.json : {},
            }
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};