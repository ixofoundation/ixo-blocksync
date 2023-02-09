import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/prisma_client";

export const createEntity = async (
    entityDoc: Prisma.EntityUncheckedCreateInput,
) => {
    try {
        return prisma.entity.create({
            data: entityDoc,
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateEntity = async (
    id: string,
    status: string,
    credentials: string[],
    controller: string,
    startDate?: Date,
    endDate?: Date,
) => {
    try {
        return prisma.entity.update({
            where: {
                id: id,
            },
            data: {
                status: status,
                credentials: { push: credentials },
                controller: { push: controller },
                startDate: startDate,
                endDate: endDate,
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateEntityVerified = async (
    id: string,
    verified: boolean,
    relayerNode: string,
) => {
    try {
        return prisma.entity.update({
            where: {
                id: id,
            },
            data: {
                verified: verified,
                relayerNode: relayerNode,
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const transferEntity = async (
    id: string,
    ownerDid: string,
    ownerAddress: string,
) => {
    try {
        return prisma.entity.update({
            where: {
                id: id,
            },
            data: {
                ownerDid: ownerDid,
                ownerAddress: ownerAddress,
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};
