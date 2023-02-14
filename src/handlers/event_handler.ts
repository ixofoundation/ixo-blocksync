import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";

export const createEvent = async (
    eventDoc: Prisma.EventUncheckedCreateInput,
) => {
    try {
        const res = await prisma.event.create({ data: eventDoc });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getEventsByType = async (
    type: string,
    page?: string,
    size?: string,
) => {
    if (page && size) {
        return prisma.event.findMany({
            where: { type: type },
            skip: Number(size) * (Number(page) - 1),
            take: Number(size),
        });
    } else {
        return prisma.event.findMany({
            where: { type: type },
        });
    }
};

export const getEntityId = async () => {
    const res = await prisma.event.findFirst({
        where: {
            type: "ixo.entity.v1beta1.EntityCreatedEvent",
        },
        select: {
            attributes: true,
        },
        take: -1,
    });
    const value = res!.attributes![0]!["value"];
    return value.toString().slice(1, -1);
};
