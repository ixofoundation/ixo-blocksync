import { appendFileSync } from "fs";
import { prisma } from "../prisma/prisma_client";

type error = {
    type: string;
    error: string;
};

export const createError = async (errorDoc: error) => {
    try {
        await prisma.error.create({ data: errorDoc });
    } catch (error) {
        appendFileSync(
            "error.txt",
            `error: ${error}\nerrorDoc: ${errorDoc}\n\n`,
        );
    }
};
