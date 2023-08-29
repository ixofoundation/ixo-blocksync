import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";

export const createEvent = async (
  eventDoc: Prisma.EventUncheckedCreateInput
) => {
  try {
    const res = await prisma.event.create({ data: eventDoc });
    return res;
  } catch (error) {
    console.error(error);
    return;
  }
};
