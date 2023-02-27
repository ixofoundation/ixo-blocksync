import { Entity } from "@ixo/impactxclient-sdk/types/codegen/ixo/entity/v1beta1/entity";
import { IidDocument } from "@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/iid";
import { TokenBatch } from "@ixo/impactxclient-sdk/types/codegen/ixo/token/v1beta1/tx";
import { EventTypes } from "../types/Event";
import { ConvertedEvent, getTimestamp } from "../util/proto";
import { prisma } from "../prisma/prisma_client";
import { Prisma } from "@prisma/client";

export const syncEventData = async (event: ConvertedEvent) => {
    try {
        switch (event.type) {
            case EventTypes.createIid:
                const createIid: IidDocument = JSON.parse(
                    event.attributes[0].value,
                );
                const createIidContextArr: Prisma.ContextUncheckedCreateInput[] =
                    [];
                for (const c of createIid.context) {
                    createIidContextArr.push({
                        iid: createIid.id,
                        key: c.key,
                        val: c.val,
                    });
                }
                await prisma.iID.create({
                    data: {
                        id: createIid.id,
                        controller: createIid.controller,
                        verificationMethod: JSON.stringify(
                            createIid.verificationMethod,
                        ),
                        authentication: createIid.authentication,
                        assertionMethod: createIid.assertionMethod,
                        keyAgreement: createIid.keyAgreement,
                        capabilityInvocation: createIid.capabilityInvocation,
                        capabilityDelegation: createIid.capabilityDelegation,
                        alsoKnownAs: createIid.alsoKnownAs,
                        metadata: JSON.stringify(createIid.metadata) || "",
                    },
                });
                for (const s of createIid.service) {
                    await prisma.service.create({
                        data: {
                            iid: createIid.id,
                            ...s,
                        },
                    });
                }
                for (const r of createIid.linkedResource) {
                    await prisma.linkedResource.create({
                        data: {
                            iid: createIid.id,
                            ...r,
                        },
                    });
                }
                for (const a of createIid.accordedRight) {
                    await prisma.accordedRight.create({
                        data: {
                            iid: createIid.id,
                            ...a,
                        },
                    });
                }
                for (const e of createIid.linkedEntity) {
                    await prisma.linkedEntity.create({
                        data: {
                            iid: createIid.id,
                            ...e,
                        },
                    });
                }
                await prisma.context.createMany({ data: createIidContextArr });
                break;
            case EventTypes.updateIid:
                const updateIid: IidDocument = JSON.parse(
                    event.attributes[0].value,
                );
                const updateIidContextArr: Prisma.ContextUncheckedCreateInput[] =
                    [];
                for (const c of updateIid.context) {
                    updateIidContextArr.push({
                        iid: updateIid.id,
                        key: c.key,
                        val: c.val,
                    });
                }
                await prisma.iID.update({
                    where: { id: updateIid.id },
                    data: {
                        id: updateIid.id,
                        controller: updateIid.controller,
                        verificationMethod: JSON.stringify(
                            updateIid.verificationMethod,
                        ),
                        authentication: updateIid.authentication,
                        assertionMethod: updateIid.assertionMethod,
                        keyAgreement: updateIid.keyAgreement,
                        capabilityInvocation: updateIid.capabilityInvocation,
                        capabilityDelegation: updateIid.capabilityDelegation,
                        alsoKnownAs: updateIid.alsoKnownAs,
                        metadata: JSON.stringify(updateIid.metadata) || "",
                    },
                });
                await prisma.service.deleteMany({
                    where: { iid: updateIid.id },
                });
                await prisma.linkedResource.deleteMany({
                    where: { iid: updateIid.id },
                });
                await prisma.accordedRight.deleteMany({
                    where: { iid: updateIid.id },
                });
                await prisma.linkedEntity.deleteMany({
                    where: { iid: updateIid.id },
                });
                for (const s of updateIid.service) {
                    await prisma.service.create({
                        data: {
                            iid: updateIid.id,
                            ...s,
                        },
                    });
                }
                for (const r of updateIid.linkedResource) {
                    await prisma.linkedResource.create({
                        data: {
                            iid: updateIid.id,
                            ...r,
                        },
                    });
                }
                for (const a of updateIid.accordedRight) {
                    await prisma.accordedRight.create({
                        data: {
                            iid: updateIid.id,
                            ...a,
                        },
                    });
                }
                for (const e of updateIid.linkedEntity) {
                    await prisma.linkedEntity.create({
                        data: {
                            iid: updateIid.id,
                            ...e,
                        },
                    });
                }
                await prisma.context.deleteMany({
                    where: { iid: updateIid.id },
                });
                await prisma.context.createMany({ data: updateIidContextArr });
                break;
            case EventTypes.createEntity:
                const createEntity: Entity = JSON.parse(
                    event.attributes[0].value,
                );
                const createEntityOwner: string =
                    event.attributes[1].value.slice(1, -1);
                await prisma.entity.create({
                    data: {
                        id: createEntity.id,
                        owner: createEntityOwner,
                        type: createEntity.type,
                        startDate: getTimestamp(createEntity.startDate!),
                        endDate: getTimestamp(createEntity.endDate!),
                        status: createEntity.status,
                        relayerNode: createEntity.relayerNode,
                        credentials: createEntity.credentials,
                        entityVerified: createEntity.entityVerified,
                        metadata: JSON.stringify(createEntity.metadata),
                    },
                });
                break;
            case EventTypes.udpateEntity:
                const updateEntity: Entity = JSON.parse(
                    event.attributes[0].value,
                );
                const updateEntityOwner: string =
                    event.attributes[1].value.slice(1, -1);
                await prisma.entity.update({
                    where: {
                        id: updateEntity.id,
                    },
                    data: {
                        id: updateEntity.id,
                        owner: updateEntityOwner,
                        type: updateEntity.type,
                        startDate: getTimestamp(updateEntity.startDate!),
                        endDate: getTimestamp(updateEntity.endDate!),
                        status: updateEntity.status,
                        relayerNode: updateEntity.relayerNode,
                        credentials: updateEntity.credentials,
                        entityVerified: updateEntity.entityVerified,
                        metadata: JSON.stringify(updateEntity.metadata),
                    },
                });
                break;
            case EventTypes.updateEntityVerified:
                const updateEntityVerifiedId: string =
                    event.attributes[0].value.slice(1, -1);
                const updateEntityVerifiedOwner: string =
                    event.attributes[1].value.slice(1, -1);
                const updateEntityVerifiedVerified: boolean =
                    event.attributes[2].value;
                await prisma.entity.update({
                    where: {
                        id: updateEntityVerifiedId,
                    },
                    data: {
                        entityVerified: updateEntityVerifiedVerified,
                    },
                });
                break;
            case EventTypes.transferEntity:
                const transferEntityId: string =
                    event.attributes[0].value.slice(1, -1);
                const transferEntityFrom: string =
                    event.attributes[1].value.slice(1, -1);
                const transferEntityTo: string =
                    event.attributes[2].value.slice(1, -1);
                await prisma.entity.update({
                    where: {
                        id: transferEntityId,
                    },
                    data: {
                        owner: transferEntityTo,
                    },
                });
                break;
            case EventTypes.createToken:
                const createTokenContract: string =
                    event.attributes[0].value.slice(1, -1);
                const createTokenMinter: string =
                    event.attributes[1].value.slice(1, -1);
                break;
            case EventTypes.updateToken:
                const updateTokenContract: string =
                    event.attributes[0].value.slice(1, -1);
                const updateTokenOwner: string =
                    event.attributes[1].value.slice(1, -1);
                break;
            case EventTypes.mintToken:
                const mintTokenContract: string =
                    event.attributes[0].value.slice(1, -1);
                const mintTokenMinter: string = event.attributes[1].value.slice(
                    1,
                    -1,
                );
                const mintTokenOwner: string = event.attributes[2].value.slice(
                    1,
                    -1,
                );
                const mintTokenBatches: TokenBatch[] = JSON.parse(
                    event.attributes[3].value,
                );
                break;
            case EventTypes.transferToken:
                const transferTokenOwner: string =
                    event.attributes[0].value.slice(1, -1);
                const transferTokenRecipient: string =
                    event.attributes[1].value.slice(1, -1);
                const transferTokenTokens: TokenBatch[] = JSON.parse(
                    event.attributes[2].value,
                );
                break;
            case EventTypes.cancelToken:
                const cancelTokenOwner: string =
                    event.attributes[0].value.slice(1, -1);
                const cancelTokenTokens: TokenBatch[] = JSON.parse(
                    event.attributes[1].value,
                );
                break;
            case EventTypes.retireToken:
                const retireTokenOwner: string =
                    event.attributes[0].value.slice(1, -1);
                const retireTokenTokens: TokenBatch[] = JSON.parse(
                    event.attributes[1].value,
                );
                break;
            case EventTypes.pauseToken:
                const pauseTokenMinter: string =
                    event.attributes[0].value.slice(1, -1);
                const pauseTokenContract: string =
                    event.attributes[1].value.slice(1, -1);
                const pauseTokenPaused: boolean = event.attributes[2].value;
                break;
            case EventTypes.stopToken:
                const stopTokenMinter: string = event.attributes[0].value.slice(
                    1,
                    -1,
                );
                const stopTokenContract: string =
                    event.attributes[1].value.slice(1, -1);
                const stopTokenStopped: boolean = event.attributes[2].value;
                break;
        }
    } catch (error) {
        console.log(error);
    }
};
