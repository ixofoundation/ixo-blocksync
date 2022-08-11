import { prisma } from "../prisma_client";
import { IEvent } from "../interface_models/Event";

export const createEvent = async (eventDoc: IEvent) => {
    return prisma.event.create({ data: eventDoc });
};

export const getEventsByType = async (type: string) => {
    return prisma.event.findMany({
        where: { type: type },
    });
};