import { PrismaClient } from "@prisma/client";
import { PrismaClient as PrismaClientCore } from "@db_core";

export const prisma = new PrismaClient();
export const prismaCore = new PrismaClientCore();

// prisma.$use(async (params, next) => {
//   const before = Date.now();
//   const result = await next(params);
//   const after = Date.now();
//   console.log(
//     `Query ${params.model}.${params.action} took ${after - before}ms`
//   );
//   return result;
// });
