import { EntitySDKType } from "@ixo/impactxclient-sdk/types/codegen/ixo/entity/v1beta1/entity";
import { IidDocument } from "@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/iid";
import { EventTypes } from "../types/Event";
import { ConvertedEvent } from "../util/proto";
import { prisma } from "../prisma/prisma_client";
import {
  TokenPropertiesSDKType,
  TokenSDKType,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/token/v1beta1/token";
import {
  ClaimSDKType,
  CollectionSDKType,
  DisputeSDKType,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/claims/v1beta1/claims";
import { CollectionState } from "../types/Enums";
import { getDocFromAttributes } from "../util/helpers";
import { ixo } from "@ixo/impactxclient-sdk";

export const syncEventData = async (event: ConvertedEvent) => {
  try {
    switch (event.type) {
      case EventTypes.createIid:
        const createIid: IidDocument = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.iID.create({
          data: {
            id: createIid.id,
            controller: createIid.controller,
            verificationMethod: JSON.stringify(createIid.verificationMethod),
            authentication: createIid.authentication,
            assertionMethod: createIid.assertionMethod,
            keyAgreement: createIid.keyAgreement,
            capabilityInvocation: createIid.capabilityInvocation,
            capabilityDelegation: createIid.capabilityDelegation,
            alsoKnownAs: createIid.alsoKnownAs,
            metadata: JSON.stringify(createIid.metadata),
            context: {
              create: createIid.context,
            },
            service: {
              create: createIid.service,
            },
            linkedResource: {
              create: createIid.linkedResource,
            },
            linkedClaim: {
              create: createIid.linkedClaim,
            },
            accordedRight: {
              create: createIid.accordedRight,
            },
            linkedEntity: {
              create: createIid.linkedEntity,
            },
          },
        });
        break;
      case EventTypes.updateIid:
        const updateIid: IidDocument = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await Promise.all([
          prisma.context.deleteMany({
            where: { iid: updateIid.id },
          }),
          prisma.service.deleteMany({
            where: { iid: updateIid.id },
          }),
          prisma.linkedResource.deleteMany({
            where: { iid: updateIid.id },
          }),
          prisma.linkedClaim.deleteMany({
            where: { iid: updateIid.id },
          }),
          prisma.accordedRight.deleteMany({
            where: { iid: updateIid.id },
          }),
          prisma.linkedEntity.deleteMany({
            where: { iid: updateIid.id },
          }),
        ]);
        await prisma.iID.update({
          where: { id: updateIid.id },
          data: {
            id: updateIid.id,
            controller: updateIid.controller,
            verificationMethod: JSON.stringify(updateIid.verificationMethod),
            authentication: updateIid.authentication,
            assertionMethod: updateIid.assertionMethod,
            keyAgreement: updateIid.keyAgreement,
            capabilityInvocation: updateIid.capabilityInvocation,
            capabilityDelegation: updateIid.capabilityDelegation,
            alsoKnownAs: updateIid.alsoKnownAs,
            metadata: JSON.stringify(updateIid.metadata),
            context: {
              create: updateIid.context,
            },
            service: {
              create: updateIid.service,
            },
            linkedResource: {
              create: updateIid.linkedResource,
            },
            linkedClaim: {
              create: updateIid.linkedClaim,
            },
            accordedRight: {
              create: updateIid.accordedRight,
            },
            linkedEntity: {
              create: updateIid.linkedEntity,
            },
          },
        });
        break;
      case EventTypes.createEntity:
        const createEntity: EntitySDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.entity.create({
          data: {
            id: createEntity.id,
            type: createEntity.type,
            startDate: createEntity.start_date as any,
            endDate: createEntity.end_date as any,
            status: createEntity.status,
            relayerNode: createEntity.relayer_node,
            credentials: createEntity.credentials,
            entityVerified: createEntity.entity_verified,
            metadata: JSON.stringify(createEntity.metadata),
            accounts: JSON.stringify(createEntity.accounts),
          },
        });
        break;
      case EventTypes.updateEntity:
        const updateEntity: EntitySDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.entity.update({
          where: {
            id: updateEntity.id,
          },
          data: {
            id: updateEntity.id,
            type: updateEntity.type,
            startDate: updateEntity.start_date as any,
            endDate: updateEntity.end_date as any,
            status: updateEntity.status,
            relayerNode: updateEntity.relayer_node,
            credentials: updateEntity.credentials,
            entityVerified: updateEntity.entity_verified,
            metadata: JSON.stringify(updateEntity.metadata),
            accounts: JSON.stringify(updateEntity.accounts),
          },
        });
        break;
      case EventTypes.createCollection:
        const createCollection: CollectionSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.claimCollection.create({
          data: {
            id: createCollection.id,
            entity: createCollection.entity,
            admin: createCollection.admin,
            protocol: createCollection.protocol,
            startDate: createCollection.start_date as any,
            endDate: createCollection.end_date as any,
            quota: Number(createCollection.quota),
            count: Number(createCollection.count),
            evaluated: Number(createCollection.evaluated),
            approved: Number(createCollection.approved),
            rejected: Number(createCollection.rejected),
            disputed: Number(createCollection.disputed),
            state: CollectionState[createCollection.state] as any,
            payments: JSON.stringify(createCollection.payments),
          },
        });
        break;
      case EventTypes.updateCollection:
        const updateCollection: CollectionSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.claimCollection.update({
          where: {
            id: updateCollection.id,
          },
          data: {
            id: updateCollection.id,
            entity: updateCollection.entity,
            admin: updateCollection.admin,
            protocol: updateCollection.protocol,
            startDate: updateCollection.start_date as any,
            endDate: updateCollection.end_date as any,
            quota: Number(updateCollection.quota),
            count: Number(updateCollection.count),
            evaluated: Number(updateCollection.evaluated),
            approved: Number(updateCollection.approved),
            rejected: Number(updateCollection.rejected),
            disputed: Number(updateCollection.disputed),
            state: CollectionState[updateCollection.state] as any,
            payments: JSON.stringify(updateCollection.payments),
          },
        });
        break;
      case EventTypes.submitClaim:
        const submitClaim: ClaimSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.claim.create({
          data: {
            claimId: submitClaim.claim_id,
            collectionId: submitClaim.collection_id,
            agentDid: submitClaim.agent_did,
            agentAddress: submitClaim.agent_address,
            submissionDate: submitClaim.submission_date as any,
            paymentsStatus: JSON.stringify(submitClaim.payments_status),
          },
        });
        break;
      case EventTypes.updateClaim:
        const updateClaim: ClaimSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.claim.update({
          where: {
            claimId: updateClaim.claim_id,
          },
          data: {
            claimId: updateClaim.claim_id,
            collectionId: updateClaim.collection_id,
            agentDid: updateClaim.agent_did,
            agentAddress: updateClaim.agent_address,
            submissionDate: updateClaim.submission_date as any,
            paymentsStatus: JSON.stringify(updateClaim.payments_status),
            evaluation: {
              create: {
                collectionId: updateClaim.evaluation!.collection_id,
                oracle: updateClaim.evaluation!.oracle,
                agentDid: updateClaim.evaluation!.agent_did,
                agentAddress: updateClaim.evaluation!.agent_address,
                status: ixo.claims.v1beta1.evaluationStatusFromJSON(
                  updateClaim.evaluation!.status
                ),
                reason: updateClaim.evaluation!.reason,
                verificationProof: updateClaim.evaluation!.verification_proof,
                evaluationDate: updateClaim.evaluation!.evaluation_date as any,
                amount: JSON.stringify(updateClaim.evaluation!.amount),
              },
            },
          },
        });
        break;
      case EventTypes.disputeClaim:
        const disputeClaim: DisputeSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.dispute.create({
          data: {
            proof: disputeClaim.data!.proof,
            subjectId: disputeClaim.subject_id,
            type: disputeClaim.type,
            data: JSON.stringify(disputeClaim.data!),
          },
        });
        break;
      case EventTypes.createToken:
        const createTokenToken: TokenSDKType = getDocFromAttributes(
          event.attributes,
          event.type
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
        const updateTokenToken: TokenSDKType = getDocFromAttributes(
          event.attributes,
          event.type
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
          getDocFromAttributes(event.attributes, event.type);
        await prisma.token.create({
          data: {
            id: mintTokenTokenProperties.id,
            index: mintTokenTokenProperties.index,
            name: mintTokenTokenProperties.name,
            collection: mintTokenTokenProperties.collection,
            tokenData: {
              create: mintTokenTokenProperties.tokenData,
            },
          },
        });
        break;
    }
  } catch (error) {
    console.error(error);
  }
};
