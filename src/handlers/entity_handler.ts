import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/prisma_client";

const prefixes = ["did:x:", "did:ixo:", "did:sov:"];

export const createEntity = async (
    entityDoc: Prisma.EntityUncheckedCreateInput,
    contextDocs: Prisma.ContextUncheckedCreateInput[],
    verificationDocs: Prisma.VerificationMethodUncheckedCreateInput[],
    serviceDocs: Prisma.ServiceUncheckedCreateInput[],
    accordedRightDocs: Prisma.AccordedRightUncheckedCreateInput[],
    linkedResourceDocs: Prisma.LinkedResourceUncheckedCreateInput[],
    linkedEntityDocs: Prisma.LinkedEntityUncheckedCreateInput[],
) => {
    try {
        let res: any;
        res = await prisma.entity.create({ data: entityDoc });
        if (contextDocs.length > 0) {
            res += await prisma.context.createMany({ data: contextDocs });
        }
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
    const baseEntity: any = await prisma.entity.findFirst({
        where: { id: id },
        include: {
            Context: {
                where: {
                    key: "class",
                },
            },
            Service: true,
            AccordedRight: true,
            LinkedResource: true,
            LinkedEntity: true,
        },
    });
    const serviceIds = baseEntity!.Service.map((s) => s.id);
    const accordedRightIds = baseEntity!.AccordedRight.map((a) => a.id);
    const linkedResourceIds = baseEntity!.LinkedResource.map((r) => r.id);
    const linkedEntityIds = baseEntity!.LinkedEntity.map((e) => e.id);

    let classVal: string;
    if (baseEntity!.Context.length > 0) {
        classVal = baseEntity!.Context[0].val;
        while (true) {
            let record = await prisma.entity.findFirst({
                where: { id: classVal },
                include: {
                    Context: {
                        where: {
                            key: "class",
                        },
                    },
                    Service: true,
                    AccordedRight: true,
                    LinkedResource: true,
                    LinkedEntity: true,
                },
            });
            if (!record?.Context[0]) break;
            classVal = record!.Context[0].val;
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

    const settings: any = {};
    const settingsArr = baseEntity!.LinkedResource.filter(
        (r) => r.type === "Settings",
    );
    baseEntity!.LinkedResource = baseEntity!.LinkedResource.filter(
        (r) => r.type !== "Settings",
    );
    for (const setting of settingsArr) {
        settings[`${setting.description}`] = {
            ...setting,
        };
    }
    baseEntity["settings"] = { ...settings };

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

export const getEntityCollections = async () => {
    const collections = await prisma.entity.findMany({
        where: {
            type: "asset/collection",
        },
    });
    const res: any[] = [];
    for (const c of collections) {
        const collection = await getEntityById(c.id);
        const entities = await prisma.entity.findMany({
            where: {
                Context: {
                    some: { key: "class", val: c.id },
                },
            },
        });
        const entityArr: any[] = [];
        for (const e of entities) {
            entityArr.push(await getEntityById(e.id));
        }
        res.push({ collection: collection, entities: entityArr });
    }
    return res;
};

export const getEntityCollectionById = async (id: string) => {
    const collection = await getEntityById(id);
    const entities = await prisma.entity.findMany({
        where: {
            Context: {
                some: { key: "class", val: collection.id },
            },
        },
    });
    let res: any;
    const entityArr: any[] = [];
    for (const e of entities) {
        entityArr.push(await getEntityById(e.id));
    }
    res = {
        collection: { ...collection },
        entities: entityArr,
    };
    return res;
};

export const getEntityCollectionsByOwnerDid = async (did: string) => {
    const collections = await prisma.entity.findMany({
        where: {
            type: "asset/collection",
            OR: [
                { ownerDid: prefixes[0] + did },
                { ownerDid: prefixes[1] + did },
                { ownerDid: prefixes[2] + did },
            ],
        },
    });
    const res: any[] = [];
    for (const c of collections) {
        const collection = await getEntityById(c.id);
        const entities = await prisma.entity.findMany({
            where: {
                Context: {
                    some: { key: "class", val: c.id },
                },
            },
        });
        const entityArr: any[] = [];
        for (const e of entities) {
            entityArr.push(await getEntityById(e.id));
        }
        res.push({ collection: collection, entities: entityArr });
    }
    return res;
};
