import { Prisma } from "@prisma/client";

export interface IEvent {
    type: string;
    attributes: Prisma.JsonArray;
    blockHeight: number;
    eventSource: string;
    eventIndex: [number, number];
    timestamp: Date;
};