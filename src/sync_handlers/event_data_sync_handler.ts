import { Entity } from "@ixo/impactxclient-sdk/types/codegen/ixo/entity/v1beta1/entity";
import { IidDocument } from "@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/iid";
import { EventTypes } from "../types/Event";
import { ConvertedEvent, getTimestamp } from "../util/proto";
import { prisma } from "../prisma/prisma_client";
import {
    TokenPropertiesSDKType,
    TokenSDKType,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/token/v1beta1/token";

export const syncEventData = async (event: ConvertedEvent) => {
    try {
        switch (event.type) {
            case EventTypes.createIid:
                const createIid: IidDocument = JSON.parse(
                    event.attributes[0].value,
                );
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
                for (const c of createIid.context) {
                    await prisma.context.create({
                        data: {
                            iid: createIid.id,
                            key: c.key,
                            val: c.val,
                        },
                    });
                }
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
                break;
            case EventTypes.updateIid:
                const updateIid: IidDocument = JSON.parse(
                    event.attributes[0].value,
                );
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
                await prisma.context.deleteMany({
                    where: { iid: updateIid.id },
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
                for (const c of updateIid.context) {
                    await prisma.context.create({
                        data: {
                            iid: updateIid.id,
                            key: c.key,
                            val: c.val,
                        },
                    });
                }
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
                const createTokenToken: TokenSDKType = JSON.parse(
                    event.attributes[0].value,
                );
                await prisma.tokenClass.create({
                    data: {
                        contractAddress: createTokenToken.contract_address,
                        minter: createTokenToken.minter,
                        class: createTokenToken.class,
                        name: createTokenToken.name,
                        description: createTokenToken.description,
                        image: createTokenToken.image,
                        type: createTokenToken.type,
                        cap: createTokenToken.cap,
                        supply: createTokenToken.supply,
                        paused: createTokenToken.paused,
                        stopped: createTokenToken.stopped,
                        retired: JSON.stringify(createTokenToken.retired),
                        cancelled: JSON.stringify(createTokenToken.cancelled),
                    },
                });
                break;
            case EventTypes.updateToken:
                const updateTokenToken: TokenSDKType = JSON.parse(
                    event.attributes[0].value,
                );
                await prisma.tokenClass.update({
                    where: {
                        contractAddress: updateTokenToken.contract_address,
                    },
                    data: {
                        minter: updateTokenToken.minter,
                        class: updateTokenToken.class,
                        name: updateTokenToken.name,
                        description: updateTokenToken.description,
                        image: updateTokenToken.image,
                        type: updateTokenToken.type,
                        cap: updateTokenToken.cap,
                        supply: updateTokenToken.supply,
                        paused: updateTokenToken.paused,
                        stopped: updateTokenToken.stopped,
                        retired: JSON.stringify(updateTokenToken.retired),
                        cancelled: JSON.stringify(updateTokenToken.cancelled),
                    },
                });
                break;
            case EventTypes.mintToken:
                const mintTokenTokenProperties: TokenPropertiesSDKType =
                    JSON.parse(event.attributes[4].value);
                await prisma.token.create({
                    data: {
                        id: mintTokenTokenProperties.id,
                        index: mintTokenTokenProperties.index,
                        name: mintTokenTokenProperties.name,
                        collection: mintTokenTokenProperties.collection,
                        tokenData: JSON.stringify(
                            mintTokenTokenProperties.tokenData,
                        ),
                    },
                });
                break;
        }
    } catch (error) {
        console.log(error);
    }
};
