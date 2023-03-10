import { Prisma, PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const parseJson = (json: Prisma.JsonValue) => {
    return JSON.parse(json as string);
};
