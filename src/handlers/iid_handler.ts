import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";

const prefixes = ["did:x:", "did:ixo:", "did:sov:"];

export const createIid = async (
    iidDoc: Prisma.IIDCreateInput,
    verificationMethodDocs: Prisma.VerificationMethodUncheckedCreateInput[],
    serviceDocs: Prisma.ServiceUncheckedCreateInput[],
    accordedRightDocs: Prisma.AccordedRightUncheckedCreateInput[],
    linkedResourceDocs: Prisma.LinkedResourceUncheckedCreateInput[],
    linkedEntityDocs: Prisma.LinkedEntityUncheckedCreateInput[],
) => {
    try {
        let res: any;
        res = await prisma.iID.create({ data: iidDoc });
        if (verificationMethodDocs.length > 0) {
            res += await prisma.verificationMethod.createMany({
                data: verificationMethodDocs,
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
        if (linkedResourceDocs.length > 0) {
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

export const updateIid = async (
    id: string,
    controller: string[],
    timestamp: string,
) => {
    try {
        const res = await prisma.iID.update({
            where: { id: id },
            data: { Controller: controller, updated: timestamp },
            include: {
                VerificationMethod: true,
                Service: true,
                AccordedRight: true,
                LinkedResource: true,
                LinkedEntity: true,
            },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addVerification = async (
    verificationDoc: Prisma.VerificationMethodUncheckedCreateInput,
    timestamp: string,
) => {
    try {
        await prisma.verificationMethod.create({
            data: verificationDoc,
        });
        const res = await prisma.iID.update({
            where: { id: verificationDoc.iid },
            data: { updated: timestamp },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const setVerificationRelationships = async (
    method_id: string,
    relationships: string[],
    timestamp: string,
) => {
    try {
        const verificationMethod = await prisma.verificationMethod.update({
            where: { id: method_id },
            data: {
                relationships: relationships,
            },
        });
        const res = await prisma.iID.update({
            where: { id: verificationMethod.iid },
            data: { updated: timestamp },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const revokeVerification = async (method_id: string, timestamp) => {
    try {
        const verificationMethod = await prisma.verificationMethod.delete({
            where: { id: method_id },
        });
        const res = await prisma.iID.update({
            where: { id: verificationMethod.iid },
            data: { updated: timestamp },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addService = async (
    serviceDoc: Prisma.ServiceUncheckedCreateInput,
    timestamp: string,
) => {
    try {
        const service = await prisma.service.create({ data: serviceDoc });
        const res = await prisma.iID.update({
            where: { id: service.iid },
            data: { updated: timestamp },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const deleteService = async (service_id: string, timestamp: string) => {
    try {
        const service = await prisma.service.delete({
            where: { id: service_id },
        });
        const res = await prisma.iID.update({
            where: { id: service.iid },
            data: { updated: timestamp },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addAccordedRight = async (
    accordedRightDoc: Prisma.AccordedRightUncheckedCreateInput,
    timestamp: string,
) => {
    try {
        const accordedRight = await prisma.accordedRight.create({
            data: accordedRightDoc,
        });
        const res = await prisma.iID.update({
            where: { id: accordedRight.iid },
            data: { updated: timestamp },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const deleteAccordedRight = async (
    right_id: string,
    timestamp: string,
) => {
    try {
        const accordedRight = await prisma.accordedRight.delete({
            where: { id: right_id },
        });
        const res = await prisma.iID.update({
            where: { id: accordedRight.iid },
            data: { updated: timestamp },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addLinkedEntity = async (
    linkedEntityDoc: Prisma.LinkedEntityUncheckedCreateInput,
    timestamp: string,
) => {
    try {
        const linkedEntity = await prisma.linkedEntity.create({
            data: linkedEntityDoc,
        });
        const res = await prisma.iID.update({
            where: { id: linkedEntity.iid },
            data: { updated: timestamp },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const deleteLinkedEntity = async (
    entity_id: string,
    timestamp: string,
) => {
    try {
        const linkedEntity = await prisma.linkedEntity.delete({
            where: { id: entity_id },
        });
        const res = await prisma.iID.update({
            where: { id: linkedEntity.iid },
            data: { updated: timestamp },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addLinkedResource = async (
    linkedResourceDoc: Prisma.LinkedResourceUncheckedCreateInput,
    timestamp: string,
) => {
    try {
        const linkedResource = await prisma.linkedResource.create({
            data: linkedResourceDoc,
        });
        const res = await prisma.iID.update({
            where: { id: linkedResource.iid },
            data: { updated: timestamp },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const deleteLinkedResource = async (
    resource_id: string,
    timestamp: string,
) => {
    try {
        const linkedResource = await prisma.linkedResource.delete({
            where: { id: resource_id },
        });
        const res = await prisma.iID.update({
            where: { id: linkedResource.iid },
            data: { updated: timestamp },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addContext = async (contextDoc: any, timestamp: string) => {
    try {
        const res = await prisma.iID.update({
            where: {
                id: contextDoc.id,
            },
            data: {
                Context: {
                    push: contextDoc.context,
                },
                updated: timestamp,
            },
        });
        return res;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const deleteContext = async (
    id: string,
    contextKey: string,
    timestamp: string,
) => {
    try {
        const iid = await prisma.iID.findFirst({ where: { id: id } });
        let context: any = iid?.Context;
        context = context?.filter((c: any) => c.key !== contextKey);
        const updatedIid = await prisma.iID.update({
            where: {
                id: id,
            },
            data: {
                Context: context,
                updated: timestamp,
            },
        });
        return updatedIid;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const updateMetadata = async (id: string, meta: any) => {
    try {
        const iid = await prisma.iID.update({
            where: { id: id },
            data: meta,
        });
        return iid;
    } catch (error) {
        console.log(error);
        return;
    }
};

export const getIidByIid = async (id: string) => {
    return prisma.iID.findFirst({
        where: {
            OR: [
                { id: prefixes[0] + id },
                { id: prefixes[1] + id },
                { id: prefixes[2] + id },
            ],
        },
        include: {
            VerificationMethod: true,
            Service: true,
        },
    });
};
