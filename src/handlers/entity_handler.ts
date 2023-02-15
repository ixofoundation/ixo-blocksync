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
    const baseEntity = await prisma.entity.findFirst({
        where: { id: id },
        include: {
            VerificationMethod: true,
            Service: true,
            AccordedRight: true,
            LinkedResource: true,
            LinkedEntity: true,
        },
    });
    const verificationIds = baseEntity!.VerificationMethod.map((v) => v.id);
    const serviceIds = baseEntity!.Service.map((s) => s.id);
    const accordedRightIds = baseEntity!.AccordedRight.map((a) => a.id);
    const linkedResourceIds = baseEntity!.LinkedResource.map((r) => r.id);
    const linkedEntityIds = baseEntity!.LinkedEntity.map((e) => e.id);

    let classArr: any[] = baseEntity!.context.filter(
        (c: any) => c.key === "class",
    );
    let classVal: string;
    if (classArr.length > 0) {
        classVal = classArr[0].val;
        while (true) {
            let record = await prisma.entity.findFirst({
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
            classArr = record!.context.filter((c: any) => c.key === "class");
            classVal = classArr[0].val;
            for (const verification of record.VerificationMethod) {
                if (!verificationIds.includes(verification.id)) {
                    baseEntity!.VerificationMethod.push(verification);
                    verificationIds.push(verification.id);
                }
            }
            for (const service of record.Service) {
                if (!serviceIds.includes(service.id)) {
                    baseEntity!.Service.push(service);
                    serviceIds.push(service.id);
                }
            }
            for (const accordedRight of record.AccordedRight) {
                if (!accordedRightIds.includes(accordedRight.id)) {
                    baseEntity!.AccordedRight.push(accordedRight);
                    accordedRightIds.push(accordedRight.id);
                }
            }
            for (const linkedResource of record.LinkedResource) {
                if (!linkedResourceIds.includes(linkedResource.id)) {
                    baseEntity!.LinkedResource.push(linkedResource);
                    linkedResourceIds.push(linkedResource.id);
                }
            }
            for (const linkedEntity of record.LinkedEntity) {
                if (!linkedEntityIds.includes(linkedEntity.id)) {
                    baseEntity!.LinkedEntity.push(linkedEntity);
                    linkedEntityIds.push(linkedEntity.id);
                }
            }
        }
    }

    return baseEntity;
};

export const getEntitiesByOwnerDid = async (did: string) => {
    const ids = await prisma.entity.findMany({
        where: {
            OR: [
                { ownerDid: prefixes[0] + did },
                { ownerDid: prefixes[1] + did },
                { ownerDid: prefixes[2] + did },
            ],
        },
        select: { id: true },
    });
    const entities: any[] = [];
    for (const id of ids) {
        const entity = await getEntityById(id.id);
        entities.push(entity!);
    }
    return entities;
};
