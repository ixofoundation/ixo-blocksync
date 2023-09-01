import { PrismaClient } from "@prisma/client";
import { PrismaClient as PrismaClientCore } from "@db_core";

export const prisma = new PrismaClient();
export const prismaCore = new PrismaClientCore();
