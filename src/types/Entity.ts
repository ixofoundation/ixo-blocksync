import { MsgCreateEntity } from "@ixo/impactxclient-sdk/types/codegen/ixo/entity/v1beta1/tx";
import { Prisma } from "@prisma/client";

export const convertEntity = (Entity: MsgCreateEntity, id: string) => {
    let verificationMethodDocs: Prisma.VerificationMethodUncheckedCreateInput[] =
        [];
    let serviceDocs: Prisma.ServiceUncheckedCreateInput[] = [];
    let accordedRightDocs: Prisma.AccordedRightUncheckedCreateInput[] = [];
    let linkedResourceDocs: Prisma.LinkedResourceUncheckedCreateInput[] = [];
    let linkedEntityDocs: Prisma.LinkedEntityUncheckedCreateInput[] = [];

    for (const verification of Entity.verification) {
        const verificationMethodDoc: Prisma.VerificationMethodUncheckedCreateInput =
            {
                entityId: id,
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

    for (const service of Entity.service) {
        const serviceDoc: Prisma.ServiceUncheckedCreateInput = {
            entityId: id,
            id: service.id,
            type: service.type,
            serviceEndpoint: service.serviceEndpoint,
        };
        serviceDocs.push(serviceDoc);
    }

    for (const right of Entity.accordedRight) {
        const accordedRightDoc: Prisma.AccordedRightUncheckedCreateInput = {
            entityId: id,
            id: right.id,
            type: right.type,
            mechanism: right.mechanism,
            message: right.message,
            service: right.service,
        };
        accordedRightDocs.push(accordedRightDoc);
    }

    for (const resource of Entity.linkedResource) {
        const linkedResourceDoc: Prisma.LinkedResourceUncheckedCreateInput = {
            entityId: id,
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

    for (const entity of Entity.linkedEntity) {
        const linkedEntityDoc: Prisma.LinkedEntityUncheckedCreateInput = {
            entityId: id,
            id: entity.id,
            type: entity.type,
            relationship: entity.relationship,
            service: entity.service,
        };
        linkedEntityDocs.push(linkedEntityDoc);
    }

    return {
        verificationMethodDocs,
        serviceDocs,
        accordedRightDocs,
        linkedResourceDocs,
        linkedEntityDocs,
    };
};
