import { Prisma } from "@prisma/client";

export const convertIID = (IID: any) => {
    let verificationMethodDocs: Prisma.VerificationMethodUncheckedCreateInput[] =
        [];
    let serviceDocs: Prisma.ServiceUncheckedCreateInput[] = [];
    let accordedRightDocs: Prisma.AccordedRightUncheckedCreateInput[] = [];
    let linkedResourceDocs: Prisma.LinkedResourceUncheckedCreateInput[] = [];
    let linkedEntityDocs: Prisma.LinkedEntityUncheckedCreateInput[] = [];

    IID.verifications.forEach((verification) => {
        const verificationMethodDoc: Prisma.VerificationMethodUncheckedCreateInput =
            {
                iid: IID.id,
                ...verification.method,
            };
        verificationMethodDocs.push(verificationMethodDoc);
    });

    IID.services.forEach((service) => {
        const serviceDoc: Prisma.ServiceUncheckedCreateInput = {
            iid: IID.id,
            ...service.service_data,
        };
        serviceDocs.push(serviceDoc);
    });

    IID.rights.forEach((right) => {
        const accordedRightDoc: Prisma.AccordedRightUncheckedCreateInput = {
            iid: IID.id,
            ...right,
        };
        accordedRightDocs.push(accordedRightDoc);
    });

    IID.resources.forEach((resource) => {
        const linkedResourceDoc: Prisma.LinkedResourceUncheckedCreateInput = {
            iid: IID.id,
            ...resource,
        };
        linkedResourceDocs.push(linkedResourceDoc);
    });

    IID.entities.forEach((entity) => {
        const linkedEntityDoc: Prisma.LinkedEntityUncheckedCreateInput = {
            iid: IID.id,
            ...entity,
        };
        linkedEntityDocs.push(linkedEntityDoc);
    });

    return {
        verificationMethodDocs,
        serviceDocs,
        accordedRightDocs,
        linkedResourceDocs,
        linkedEntityDocs,
    };
};
