import { MsgCreateIidDocument } from "@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/tx";
import { Prisma } from "@prisma/client";

export const convertIID = (IID: MsgCreateIidDocument) => {
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
                id: String(verification.method?.id),
                relationships: verification.relationships,
                type: String(verification.method?.type),
                controller: String(verification.method?.controller),
                verificationMaterial:
                    String(verification.method?.blockchainAccountID) ||
                    String(verification.method?.publicKeyHex) ||
                    String(verification.method?.publicKeyMultibase),
            };
        verificationMethodDocs.push(verificationMethodDoc);
    });

    IID.services.forEach((service) => {
        const serviceDoc: Prisma.ServiceUncheckedCreateInput = {
            iid: IID.id,
            ...service,
        };
        serviceDocs.push(serviceDoc);
    });

    IID.accordedRight.forEach((right) => {
        const accordedRightDoc: Prisma.AccordedRightUncheckedCreateInput = {
            iid: IID.id,
            ...right,
        };
        accordedRightDocs.push(accordedRightDoc);
    });

    IID.linkedResource.forEach((resource) => {
        const linkedResourceDoc: Prisma.LinkedResourceUncheckedCreateInput = {
            iid: IID.id,
            ...resource,
        };
        linkedResourceDocs.push(linkedResourceDoc);
    });

    IID.linkedEntity.forEach((entity) => {
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
