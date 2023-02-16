import { MsgCreateIidDocument } from "@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/tx";
import { Prisma } from "@prisma/client";

export const convertIID = (IID: MsgCreateIidDocument) => {
    let contextDocs: Prisma.ContextUncheckedCreateInput[] = [];
    let verificationMethodDocs: Prisma.VerificationMethodUncheckedCreateInput[] =
        [];
    let serviceDocs: Prisma.ServiceUncheckedCreateInput[] = [];
    let accordedRightDocs: Prisma.AccordedRightUncheckedCreateInput[] = [];
    let linkedResourceDocs: Prisma.LinkedResourceUncheckedCreateInput[] = [];
    let linkedEntityDocs: Prisma.LinkedEntityUncheckedCreateInput[] = [];

    for (const context of IID.context) {
        const contextDoc: Prisma.ContextUncheckedCreateInput = {
            iid: IID.id,
            key: context.key,
            val: context.val,
        };
        contextDocs.push(contextDoc);
    }

    for (const verification of IID.verifications) {
        const verificationMethodDoc: Prisma.VerificationMethodUncheckedCreateInput =
            {
                iid: IID.id,
                id: verification.method?.id || "",
                relationships: verification.relationships || [],
                type: verification.method?.type || "",
                controller: verification.method?.controller || "",
                blockchainAccountID: verification.method?.blockchainAccountID,
                publicKeyHex: verification.method?.publicKeyHex,
                publicKeyMultibase: verification.method?.publicKeyMultibase,
                publicKeyBase58: verification.method?.publicKeyBase58,
                context: verification.context,
            };
        verificationMethodDocs.push(verificationMethodDoc);
    }

    for (const service of IID.services) {
        const serviceDoc: Prisma.ServiceUncheckedCreateInput = {
            iid: IID.id,
            id: service.id,
            type: service.type,
            serviceEndpoint: service.serviceEndpoint,
        };
        serviceDocs.push(serviceDoc);
    }

    for (const right of IID.accordedRight) {
        const accordedRightDoc: Prisma.AccordedRightUncheckedCreateInput = {
            iid: IID.id,
            id: right.id,
            type: right.type,
            mechanism: right.mechanism,
            message: right.message,
            service: right.service,
        };
        accordedRightDocs.push(accordedRightDoc);
    }

    for (const resource of IID.linkedResource) {
        const linkedResourceDoc: Prisma.LinkedResourceUncheckedCreateInput = {
            iid: IID.id,
            id: resource.id,
            type: resource.type,
            description: resource.description,
            mediaType: resource.mediaType,
            serviceEndpoint: resource.serviceEndpoint,
            proof: resource.proof,
            encrypted: resource.encrypted,
            right: resource.right,
        };
        linkedResourceDocs.push(linkedResourceDoc);
    }

    for (const entity of IID.linkedEntity) {
        const linkedEntityDoc: Prisma.LinkedEntityUncheckedCreateInput = {
            iid: IID.id,
            id: entity.id,
            type: entity.type,
            relationship: entity.relationship,
            service: entity.service,
        };
        linkedEntityDocs.push(linkedEntityDoc);
    }

    return {
        contextDocs,
        verificationMethodDocs,
        serviceDocs,
        accordedRightDocs,
        linkedResourceDocs,
        linkedEntityDocs,
    };
};
