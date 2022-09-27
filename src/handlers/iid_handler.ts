import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";

export const createIid = async (
    iidDoc: Prisma.IIDCreateInput,
    verificationMethodDocs: Prisma.VerificationMethodUncheckedCreateInput[],
    serviceDocs: Prisma.ServiceUncheckedCreateInput[],
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
            data: { controller: controller, updated: timestamp },
            include: { VerificationMethod: true, Service: true },
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

export const getIidByIid = async (id: string) => {
    return prisma.iID.findFirst({
        where: { id: id },
        include: {
            VerificationMethod: true,
            Service: true,
        },
    });
};
