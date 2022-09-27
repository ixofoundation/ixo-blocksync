import { Prisma } from "@prisma/client";

export const convertIID = (IID: any) => {
    let verificationMethodDocs: Prisma.VerificationMethodUncheckedCreateInput[] =
        [];
    let serviceDocs: Prisma.ServiceUncheckedCreateInput[] = [];

    IID.verifications.forEach((verification) => {
        const verificationMethodDoc: Prisma.VerificationMethodUncheckedCreateInput =
            {
                id: verification.method.id,
                iid: IID.id,
                relationships: verification.relationships,
                type: verification.method.type,
                controller: verification.method.controller,
                verificationMaterial: verification.method.verificationMaterial,
            };
        verificationMethodDocs.push(verificationMethodDoc);
    });

    IID.services.forEach((service) => {
        const serviceDoc: Prisma.ServiceUncheckedCreateInput = {
            id: service.service_data.id,
            iid: IID.id,
            type: service.service_data.type,
            serviceEndpoint: service.service_data.serviceEndpoint,
        };
        serviceDocs.push(serviceDoc);
    });

    return { verificationMethodDocs, serviceDocs };
};
