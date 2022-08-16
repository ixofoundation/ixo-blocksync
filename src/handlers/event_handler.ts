import { prisma } from "../prisma/prisma_client";
import { io } from "../server";
import { IEvent } from "../prisma/interface_models/Event";

export const createEvent = async (eventDoc: IEvent) => {
    try {
        const res = await prisma.event.create({ data: eventDoc });
        io.emit("Event Created", res);
    } catch (error) {
        console.log(error);
        return;
    };
};

export const getEventsByType = async (type: string) => {
    return prisma.event.findMany({
        where: { type: type },
    });
};