import { prisma } from "../prisma/prisma_client";
import { getAccountEntities } from "../util/proto";

export const getEntityById = async (id: string) => {
    const baseEntity: any = await prisma.entity.findFirst({
        where: { id: id },
        include: {
            IID: {
                include: {
                    context: { where: { key: "class" } },
                    accordedRight: true,
                    linkedEntity: true,
                    linkedResource: true,
                    service: true,
                },
            },
        },
    });

    const serviceIds = baseEntity!.IID.service.map((s) => s.id);
    const accordedRightIds = baseEntity!.IID.accordedRight.map((a) => a.id);
    const linkedResourceIds = baseEntity!.IID.linkedResource.map((r) => r.id);
    const linkedEntityIds = baseEntity!.IID.linkedEntity.map((e) => e.id);

    for (const key of Object.keys(baseEntity!.IID)) {
        baseEntity[key] = baseEntity!.IID[key];
    }
    delete baseEntity!.IID;

    let classVal: string;
    if (baseEntity!.context.length > 0) {
        classVal = baseEntity!.context[0].val;
        while (true) {
            let record = await prisma.entity.findFirst({
                where: { id: classVal },
                include: {
                    IID: {
                        include: {
                            context: { where: { key: "class" } },
                            accordedRight: true,
                            linkedEntity: true,
                            linkedResource: true,
                            service: true,
                        },
                    },
                },
            });
            if (!record?.IID.context[0]) break;
            classVal = record!.IID.context[0].val;
            for (const service of record!.IID.service) {
                if (!serviceIds.includes(service.id)) {
                    baseEntity!.service.push(service);
                    serviceIds.push(service.id);
                }
            }
            for (const accordedRight of record!.IID.accordedRight) {
                if (!accordedRightIds.includes(accordedRight.id)) {
                    baseEntity!.accordedRight.push(accordedRight);
                    accordedRightIds.push(accordedRight.id);
                }
            }
            for (const linkedResource of record!.IID.linkedResource) {
                if (!linkedResourceIds.includes(linkedResource.id)) {
                    baseEntity!.linkedResource.push(linkedResource);
                    linkedResourceIds.push(linkedResource.id);
                }
            }
            for (const linkedEntity of record!.IID.linkedEntity) {
                if (!linkedEntityIds.includes(linkedEntity.id)) {
                    baseEntity!.linkedEntity.push(linkedEntity);
                    linkedEntityIds.push(linkedEntity.id);
                }
            }
        }
    }

    const settings: any = {};
    const settingsArr = baseEntity!.linkedResource.filter(
        (r) => r.type === "Settings",
    );
    baseEntity!.linkedResource = baseEntity!.linkedResource.filter(
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

export const getEntitiesByOwnerAddress = async (address: string) => {
    const ids = await getAccountEntities(address);
    const entities: any[] = [];
    for (const id of ids) {
        const entity = await getEntityById(id);
        entities.push(entity);
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
        res.push(await getEntityCollectionById(c.id));
    }
    return res;
};

export const getEntityCollectionById = async (id: string) => {
    const collection = await getEntityById(id);
    const entities = await prisma.entity.findMany({
        where: {
            IID: {
                context: {
                    some: { key: "class", val: collection.id },
                },
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

export const getEntityCollectionsByOwnerAddress = async (address: string) => {
    const entities = await getEntitiesByOwnerAddress(address);
    const collections = entities.filter((e) => e.type === "asset/collection");
    const res: any[] = [];
    for (const collection of collections) {
        res.push(await getEntityCollectionById(collection.id));
    }
    return res;
};
