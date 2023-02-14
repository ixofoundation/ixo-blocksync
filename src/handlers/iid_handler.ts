import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";

const prefixes = ["did:x:", "did:ixo:", "did:sov:"];

interface Context {
    key: string;
    val: string;
}

export const createIid = async (
    iidDoc: Prisma.IIDCreateInput,
    verificationDocs: Prisma.VerificationMethodUncheckedCreateInput[],
    serviceDocs: Prisma.ServiceUncheckedCreateInput[],
    accordedRightDocs: Prisma.AccordedRightUncheckedCreateInput[],
    linkedResourceDocs: Prisma.LinkedResourceUncheckedCreateInput[],
    linkedEntityDocs: Prisma.LinkedEntityUncheckedCreateInput[],
) => {
    try {
        let res: any;
        res = await prisma.iID.create({ data: iidDoc });
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

export const updateIid = async (
    id: string,
    controllers: string[],
    context: any,
    verificationDocs: Prisma.VerificationMethodUncheckedCreateInput[],
    serviceDocs: Prisma.ServiceUncheckedCreateInput[],
    accordedRightDocs: Prisma.AccordedRightUncheckedCreateInput[],
    linkedResourceDocs: Prisma.LinkedResourceUncheckedCreateInput[],
    linkedEntityDocs: Prisma.LinkedEntityUncheckedCreateInput[],
    alsoKnownAs: string,
) => {
    try {
        let res: any;
        res = await prisma.iID.update({
            where: {
                id: id,
            },
            data: {
                controllers: controllers,
                context: context,
                alsoKnownAs: alsoKnownAs,
            },
        });
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

export const addVerification = async (
    verificationMethodDoc: Prisma.VerificationMethodUncheckedCreateInput,
) => {
    try {
        return prisma.verificationMethod.create({
            data: verificationMethodDoc,
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const setVerificationRelationships = async (
    iid: string,
    methodId: string,
    relationships: string[],
) => {
    try {
        return prisma.verificationMethod.updateMany({
            where: { id: methodId, iid: iid },
            data: {
                relationships: relationships,
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const revokeVerification = async (iid: string, methodId: string) => {
    try {
        return prisma.verificationMethod.deleteMany({
            where: { id: methodId, iid: iid },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addService = async (
    serviceDoc: Prisma.ServiceUncheckedCreateInput,
) => {
    try {
        return prisma.service.create({ data: serviceDoc });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const deleteService = async (iid: string, serviceId: string) => {
    try {
        return prisma.service.deleteMany({
            where: { id: serviceId, iid: iid },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addController = async (iid: string, controllerDid: string) => {
    try {
        return prisma.iID.update({
            where: {
                id: iid,
            },
            data: {
                controllers: {
                    push: controllerDid,
                },
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const deleteController = async (iid: string, controllerDid: string) => {
    try {
        const iidDoc = await prisma.iID.findFirst({ where: { id: iid } });
        const controllers = iidDoc?.controllers || [];
        const index = controllers.indexOf(controllerDid);
        if (index > -1) {
            controllers.splice(index, 1);
        }
        return prisma.iID.update({
            where: {
                id: iid,
            },
            data: {
                controllers: controllers,
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addLinkedResource = async (
    linkedResourceDoc: Prisma.LinkedResourceUncheckedCreateInput,
) => {
    try {
        return prisma.linkedResource.create({
            data: linkedResourceDoc,
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const deleteLinkedResource = async (iid: string, resourceId: string) => {
    try {
        return prisma.linkedResource.deleteMany({
            where: { id: resourceId, iid: iid },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addLinkedEntity = async (
    linkedEntityDoc: Prisma.LinkedEntityUncheckedCreateInput,
) => {
    try {
        return prisma.linkedEntity.create({
            data: linkedEntityDoc,
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const deleteLinkedEntity = async (iid: string, entityId: string) => {
    try {
        return prisma.linkedEntity.deleteMany({
            where: { id: entityId, iid: iid },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addAccordedRight = async (
    accordedRightDoc: Prisma.AccordedRightUncheckedCreateInput,
) => {
    try {
        return prisma.accordedRight.create({
            data: accordedRightDoc,
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const deleteAccordedRight = async (iid: string, rightId: string) => {
    try {
        return prisma.accordedRight.deleteMany({
            where: { id: rightId, iid: iid },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const addContext = async (iid: string, context: Context) => {
    try {
        return prisma.iID.update({
            where: {
                id: iid,
            },
            data: {
                context: {
                    push: JSON.stringify(context),
                },
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const deleteContext = async (iid: string, contextKey: string) => {
    try {
        const iidDoc = await prisma.iID.findFirst({ where: { id: iid } });
        const context: any = iidDoc?.context;
        const newContext = context.filter((con: any) => {
            return con.key !== contextKey;
        });
        return prisma.iID.update({
            where: {
                id: iid,
            },
            data: {
                context: newContext,
            },
        });
    } catch (error) {
        console.log(error);
        return;
    }
};

export const deactivateIid = async (iid: string, state: boolean) => {
    try {
        return prisma.iID.update({
            where: {
                id: iid,
            },
            data: {
                state: state,
            },
        });
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
