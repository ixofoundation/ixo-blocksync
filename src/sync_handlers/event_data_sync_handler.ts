import { EntitySDKType } from "@ixo/impactxclient-sdk/types/codegen/ixo/entity/v1beta1/entity";
import { IidDocument } from "@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/iid";
import { EventTypes } from "../types/Event";
import { ConvertedEvent, getTimestamp } from "../util/proto";
import { prisma } from "../prisma/prisma_client";
import {
    TokenPropertiesSDKType,
    TokenSDKType,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/token/v1beta1/token";
import { Collection } from "@ixo/impactxclient-sdk/types/codegen/ixo/claims/v1beta1/claims";
import {
    Claim,
    Dispute,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/claims/v1beta1/claims";

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
                for (const c of createIid.linkedClaim) {
                    await prisma.linkedClaim.create({
                        data: {
                            iid: createIid.id,
                            ...c,
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
                await prisma.linkedClaim.deleteMany({
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
                for (const c of updateIid.linkedClaim) {
                    await prisma.linkedClaim.create({
                        data: {
                            iid: updateIid.id,
                            ...c,
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
                const createEntity: EntitySDKType = JSON.parse(
                    event.attributes[0].value,
                );
                await prisma.entity.create({
                    data: {
                        id: createEntity.id,
                        type: createEntity.type,
                        startDate: getTimestamp(createEntity.start_date!),
                        endDate: getTimestamp(createEntity.end_date!),
                        status: createEntity.status,
                        relayerNode: createEntity.relayer_node,
                        credentials: createEntity.credentials,
                        entityVerified: createEntity.entity_verified,
                        metadata: JSON.stringify(createEntity.metadata),
                    },
                });
                break;
            case EventTypes.updateEntity:
                const updateEntity: EntitySDKType = JSON.parse(
                    event.attributes[0].value,
                );
                await prisma.entity.update({
                    where: {
                        id: updateEntity.id,
                    },
                    data: {
                        id: updateEntity.id,
                        type: updateEntity.type,
                        startDate: getTimestamp(updateEntity.start_date!),
                        endDate: getTimestamp(updateEntity.end_date!),
                        status: updateEntity.status,
                        relayerNode: updateEntity.relayer_node,
                        credentials: updateEntity.credentials,
                        entityVerified: updateEntity.entity_verified,
                        metadata: JSON.stringify(updateEntity.metadata),
                    },
                });
                break;
            case EventTypes.createCollection:
                const createCollection: Collection = JSON.parse(
                    event.attributes[0].value,
                );
                console.log(createCollection);
                await prisma.claimCollection.create({
                    data: {
                        id: createCollection.id,
                        entity: createCollection.entity,
                        admin: createCollection.admin,
                        protocol: createCollection.protocol,
                        startDate: getTimestamp(createCollection.startDate!),
                        endDate: getTimestamp(createCollection.endDate!),
                        quota: Number(createCollection.quota),
                        count: Number(createCollection.count),
                        evaluated: Number(createCollection.evaluated),
                        approved: Number(createCollection.approved),
                        rejected: Number(createCollection.rejected),
                        disputed: Number(createCollection.disputed),
                        state: createCollection.state,
                        payments: JSON.stringify(createCollection.payments),
                    },
                });
                break;
            case EventTypes.updateCollection:
                const updateCollection: Collection = JSON.parse(
                    event.attributes[0].value,
                );
                console.log(updateCollection);
                await prisma.claimCollection.update({
                    where: {
                        id: updateCollection.id,
                    },
                    data: {
                        id: updateCollection.id,
                        entity: updateCollection.entity,
                        admin: updateCollection.admin,
                        protocol: updateCollection.protocol,
                        startDate: getTimestamp(updateCollection.startDate!),
                        endDate: getTimestamp(updateCollection.endDate!),
                        quota: Number(updateCollection.quota),
                        count: Number(updateCollection.count),
                        evaluated: Number(updateCollection.evaluated),
                        approved: Number(updateCollection.approved),
                        rejected: Number(updateCollection.rejected),
                        disputed: Number(updateCollection.disputed),
                        state: updateCollection.state,
                        payments: JSON.stringify(updateCollection.payments),
                    },
                });
                break;
            case EventTypes.submitClaim:
                const submitClaim: Claim = JSON.parse(
                    event.attributes[0].value,
                );
                console.log(submitClaim);
                await prisma.iClaim.create({
                    data: {
                        claimId: submitClaim.claimId,
                        collectionId: submitClaim.collectionId,
                        agentDid: submitClaim.agentDid,
                        agentAddress: submitClaim.agentAddress,
                        submissionDate: getTimestamp(
                            submitClaim.submissionDate!,
                        ),
                        evaluation: JSON.stringify(submitClaim.evaluation),
                        paymentsStatus: JSON.stringify(
                            submitClaim.paymentsStatus,
                        ),
                    },
                });
                break;
            case EventTypes.updateClaim:
                const updateClaim: Claim = JSON.parse(
                    event.attributes[0].value,
                );
                console.log(updateClaim);
                await prisma.iClaim.update({
                    where: {
                        claimId: updateClaim.claimId,
                    },
                    data: {
                        claimId: updateClaim.claimId,
                        collectionId: updateClaim.collectionId,
                        agentDid: updateClaim.agentDid,
                        agentAddress: updateClaim.agentAddress,
                        submissionDate: getTimestamp(
                            updateClaim.submissionDate!,
                        ),
                        evaluation: JSON.stringify(updateClaim.evaluation),
                        paymentsStatus: JSON.stringify(
                            updateClaim.paymentsStatus,
                        ),
                    },
                });
                break;
            case EventTypes.disputeClaim:
                const disputeClaim: Dispute = JSON.parse(
                    event.attributes[0].value,
                );
                console.log(disputeClaim);
                await prisma.dispute.create({
                    data: {
                        proof: disputeClaim.data!.proof,
                        subjectId: disputeClaim.subjectId,
                        type: disputeClaim.type,
                        data: JSON.stringify(disputeClaim.data!),
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
