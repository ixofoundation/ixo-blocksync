import { prisma } from "../prisma/prisma_client";

const prefixes = ["did:x:", "did:ixo:", "did:sov:"];

// export const listTransactionsByType = async (
//     type: string,
//     page?: string,
//     size?: string,
// ) => {
//     if (page && size) {
//         return prisma.transaction.findMany({
//             where: { type: type },
//             skip: Number(size) * (Number(page) - 1),
//             take: Number(size),
//         });
//     } else {
//         return prisma.transaction.findMany({
//             where: { type: type },
//         });
//     }
// };

// export const listTransactionsByAddress = async (
//     address: string,
//     page?: string,
//     size?: string,
// ) => {
//     if (page && size) {
//         return prisma.transaction.findMany({
//             where: {
//                 OR: [
//                     { from: prefixes[0] + address },
//                     { from: prefixes[1] + address },
//                     { from: prefixes[2] + address },
//                 ],
//             },
//             skip: Number(size) * (Number(page) - 1),
//             take: Number(size),
//         });
//     } else {
//         return prisma.transaction.findMany({
//             where: { from: address },
//         });
//     }
// };

// export const listTransactionsByAddressAndType = async (
//     address: string,
//     type: string,
//     page?: string,
//     size?: string,
// ) => {
//     return prisma.transaction.findMany({
//         where: {
//             OR: [
//                 { from: prefixes[0] + address },
//                 { from: prefixes[1] + address },
//                 { from: prefixes[2] + address },
//             ],
//             type: type,
//         },
//         skip: Number(size) * (Number(page) - 1),
//         take: Number(size),
//     });
// };
