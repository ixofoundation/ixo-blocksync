import { Prisma } from "@prisma/client";

export interface IEvent {
    type: string;
    attributes: Prisma.JsonArray;
    blockHeight: bigint;
    eventSource: string;
    eventIndex: [bigint, bigint];
    timestamp: Date;
};