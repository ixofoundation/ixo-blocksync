import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/prisma_client";

const prefixes = ["did:x:", "did:ixo:", "did:sov:"];

export const createEntity = async (
    entityDoc: Prisma.EntityUncheckedCreateInput,
    verificationDocs: Prisma.VerificationMethodUncheckedCreateInput[],
    serviceDocs: Prisma.ServiceUncheckedCreateInput[],
    accordedRightDocs: Prisma.AccordedRightUncheckedCreateInput[],
    linkedResourceDocs: Prisma.LinkedResourceUncheckedCreateInput[],
    linkedEntityDocs: Prisma.LinkedEntityUncheckedCreateInput[],
) => {
    try {
        let res: any;
        res = await prisma.entity.create({ data: entityDoc });
        if (verificationDocs.length > 0) {
            res += await prisma.verificationMethod.createMany({
                data: verificationDocs,
            });
        }
        if (serviceDocs.length > 0) {
            res += await prisma.service.createMany({ data: serviceDocs });
        }
        if (accordedRightDocs.length > 0) {
            res += await prisma.accordedRight.createMany({
                data: accordedRightDocs,
            });
        }
        if (linkedResourceDocs.length > 0) {
            res += await prisma.linkedResource.createMany({
                data: linkedResourceDocs,
            });
        }
        if (linkedEntityDocs.length > 0) {
            res += await prisma.linkedEntity.createMany({
                data: linkedEntityDocs,
            });
        }
        return res;
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

export const getEntityById = async (id: string) => {
    let record = await prisma.entity.findFirst({
        where: { id: id },
        include: {
            VerificationMethod: true,
            Service: true,
            AccordedRight: true,
            LinkedResource: true,
            LinkedEntity: true,
        },
    });
    let classVal = record!.context![1]!["val"];
    let prevRecord: any;
    while (true) {
        prevRecord = record;
        record = await prisma.entity.findFirst({
            where: { id: classVal },
            include: {
                VerificationMethod: true,
                Service: true,
                AccordedRight: true,
                LinkedResource: true,
                LinkedEntity: true,
            },
        });
        if (!record) break;
        classVal = record!.context![1]!["val"];
    }
    return prevRecord;
};

export const getEntitiesByOwnerDid = async (did: string) => {
    return prisma.entity.findMany({
        where: {
            OR: [
                { ownerDid: prefixes[0] + did },
                { ownerDid: prefixes[1] + did },
                { ownerDid: prefixes[2] + did },
            ],
        },
        include: {
            VerificationMethod: true,
            Service: true,
            AccordedRight: true,
            LinkedResource: true,
            LinkedEntity: true,
        },
    });
};
