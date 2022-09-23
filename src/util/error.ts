import { prisma } from "../prisma/prisma_client";

type error = {
    type: string;
    error: string;
};

export const createError = async (errorDoc: error) => {
    await prisma.error.create({ data: errorDoc });
};
