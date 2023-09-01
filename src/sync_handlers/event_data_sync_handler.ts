import { EntitySDKType } from "@ixo/impactxclient-sdk/types/codegen/ixo/entity/v1beta1/entity";
import { IidDocumentSDKType } from "@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/iid";
import { EventTypes } from "../types/Event";
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
import { getDocFromAttributes, getValueFromAttributes } from "../util/helpers";
import { ixo } from "@ixo/impactxclient-sdk";
import {
  BondSDKType,
  BuyOrderSDKType,
  SellOrderSDKType,
  SwapOrderSDKType,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/bonds/v1beta1/bonds";
import { GetEventType } from "../types/getBlock";

export const syncEventData = async (
  event: GetEventType,
  blockHeight: number,
  timestamp: Date
) => {
  try {
    switch (event.type) {
      // ==========================================================
      // IID
      // ==========================================================
      case EventTypes.createIid:
        const createIid: IidDocumentSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.iID.create({
          data: {
            id: createIid.id,
            controller: createIid.controller,
            authentication: createIid.authentication,
            assertionMethod: createIid.assertionMethod,
            keyAgreement: createIid.keyAgreement,
            capabilityInvocation: createIid.capabilityInvocation,
            capabilityDelegation: createIid.capabilityDelegation,
            alsoKnownAs: createIid.alsoKnownAs,
            verificationMethod: createIid.verificationMethod as any,
            metadata: createIid.metadata as any,
            context: createIid.context as any,
            service: createIid.service as any,
            linkedResource: createIid.linkedResource as any,
            linkedClaim: createIid.linkedClaim as any,
            accordedRight: createIid.accordedRight as any,
            linkedEntity: createIid.linkedEntity as any,
          },
        });
        break;
      case EventTypes.updateIid:
        const updateIid: IidDocumentSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.iID.update({
          where: { id: updateIid.id },
          data: {
            id: updateIid.id,
            controller: updateIid.controller,
            verificationMethod: updateIid.verificationMethod as any,
            authentication: updateIid.authentication,
            assertionMethod: updateIid.assertionMethod,
            keyAgreement: updateIid.keyAgreement,
            capabilityInvocation: updateIid.capabilityInvocation,
            capabilityDelegation: updateIid.capabilityDelegation,
            alsoKnownAs: updateIid.alsoKnownAs,
            metadata: updateIid.metadata as any,
            context: updateIid.context as any,
            service: updateIid.service as any,
            linkedResource: updateIid.linkedResource as any,
            linkedClaim: updateIid.linkedClaim as any,
            accordedRight: updateIid.accordedRight as any,
            linkedEntity: updateIid.linkedEntity as any,
          },
        });
        break;

      // ==========================================================
      // ENTITY
      // ==========================================================
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
            metadata: createEntity.metadata as any,
            accounts: createEntity.accounts as any,
          },
        });
        break;
      case EventTypes.updateEntity:
        const updateEntity: EntitySDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.entity.update({
          where: { id: updateEntity.id },
          data: {
            id: updateEntity.id,
            type: updateEntity.type,
            startDate: updateEntity.start_date as any,
            endDate: updateEntity.end_date as any,
            status: updateEntity.status,
            relayerNode: updateEntity.relayer_node,
            credentials: updateEntity.credentials,
            entityVerified: updateEntity.entity_verified,
            metadata: updateEntity.metadata as any,
            accounts: updateEntity.accounts as any,
          },
        });
        break;

      // ==========================================================
      // CLAIMS
      // ==========================================================
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
            state: ixo.claims.v1beta1.collectionStateFromJSON(
              createCollection.state
            ),
            payments: createCollection.payments as any,
          },
        });
        break;
      case EventTypes.updateCollection:
        const updateCollection: CollectionSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.claimCollection.update({
          where: { id: updateCollection.id },
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
            state: ixo.claims.v1beta1.collectionStateFromJSON(
              updateCollection.state
            ),
            payments: updateCollection.payments as any,
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
            paymentsStatus: submitClaim.payments_status as any,
          },
        });
        break;
      case EventTypes.updateClaim:
        const updateClaim: ClaimSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        const evaluation = updateClaim.evaluation
          ? {
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
              amount: updateClaim.evaluation!.amount as any,
            }
          : null;
        await prisma.claim.update({
          where: { claimId: updateClaim.claim_id },
          data: {
            claimId: updateClaim.claim_id,
            collectionId: updateClaim.collection_id,
            agentDid: updateClaim.agent_did,
            agentAddress: updateClaim.agent_address,
            submissionDate: updateClaim.submission_date as any,
            paymentsStatus: updateClaim.payments_status as any,
            ...(evaluation && {
              evaluation: {
                upsert: {
                  create: evaluation,
                  update: evaluation,
                },
              },
            }),
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
            data: disputeClaim.data as any,
          },
        });
        break;

      // ==========================================================
      // TOKEN
      // ==========================================================
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
            retired: { create: createTokenToken.retired },
            cancelled: { create: createTokenToken.cancelled },
          },
        });
        break;
      case EventTypes.updateToken:
        const updateTokenToken: TokenSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.tokenClass.update({
          where: { contractAddress: updateTokenToken.contract_address },
          data: {
            retired: { deleteMany: {} },
            cancelled: { deleteMany: {} },
          },
        });
        await prisma.tokenClass.update({
          where: { contractAddress: updateTokenToken.contract_address },
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
            retired: { create: updateTokenToken.retired },
            cancelled: { create: updateTokenToken.cancelled },
          },
        });
        break;
      case EventTypes.mintToken:
        const mintTokenTokenProperties: TokenPropertiesSDKType =
          getDocFromAttributes(event.attributes, event.type);
        await prisma.tokenClass.update({
          where: { name: mintTokenTokenProperties.name },
          data: {
            Token: {
              create: {
                id: mintTokenTokenProperties.id,
                index: mintTokenTokenProperties.index,
                collection: mintTokenTokenProperties.collection,
                tokenData: {
                  create: mintTokenTokenProperties.tokenData,
                },
              },
            },
          },
        });
        break;

      // ==========================================================
      // BONDS
      // ==========================================================
      case EventTypes.createBond:
        const createBond: BondSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.bond.create({
          data: {
            token: createBond.token,
            name: createBond.name,
            description: createBond.description,
            creatorDid: createBond.creator_did,
            controllerDid: createBond.controller_did,
            functionType: createBond.function_type,
            functionParameters: createBond.function_parameters as any,
            reserveTokens: createBond.reserve_tokens,
            txFeePercentage: createBond.tx_fee_percentage,
            exitFeePercentage: createBond.exit_fee_percentage,
            feeAddress: createBond.fee_address,
            reserveWithdrawalAddress: createBond.reserve_withdrawal_address,
            maxSupply: createBond.max_supply as any,
            orderQuantityLimits: createBond.order_quantity_limits as any,
            sanityRate: createBond.sanity_rate,
            sanityMarginPercentage: createBond.sanity_margin_percentage,
            currentSupply: createBond.current_supply as any,
            currentReserve: createBond.current_reserve as any,
            availableReserve: createBond.available_reserve as any,
            currentOutcomePaymentReserve:
              createBond.current_outcome_payment_reserve as any,
            allowSells: createBond.allow_sells,
            allowReserveWithdrawals: createBond.allow_reserve_withdrawals,
            alphaBond: createBond.alpha_bond,
            batchBlocks: createBond.batch_blocks,
            outcomePayment: createBond.outcome_payment,
            state: createBond.state,
            bondDid: createBond.bond_did,
            oracleDid: createBond.oracle_did,
          },
        });
        break;
      case EventTypes.updateBond:
        const updateBond: BondSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.bond.update({
          where: { bondDid: updateBond.bond_did },
          data: {
            token: updateBond.token,
            name: updateBond.name,
            description: updateBond.description,
            creatorDid: updateBond.creator_did,
            controllerDid: updateBond.controller_did,
            functionType: updateBond.function_type,
            functionParameters: updateBond.function_parameters as any,
            reserveTokens: updateBond.reserve_tokens,
            txFeePercentage: updateBond.tx_fee_percentage,
            exitFeePercentage: updateBond.exit_fee_percentage,
            feeAddress: updateBond.fee_address,
            reserveWithdrawalAddress: updateBond.reserve_withdrawal_address,
            maxSupply: updateBond.max_supply as any,
            orderQuantityLimits: updateBond.order_quantity_limits as any,
            sanityRate: updateBond.sanity_rate,
            sanityMarginPercentage: updateBond.sanity_margin_percentage,
            currentSupply: updateBond.current_supply as any,
            currentReserve: updateBond.current_reserve as any,
            availableReserve: updateBond.available_reserve as any,
            currentOutcomePaymentReserve:
              updateBond.current_outcome_payment_reserve as any,
            allowSells: updateBond.allow_sells,
            allowReserveWithdrawals: updateBond.allow_reserve_withdrawals,
            alphaBond: updateBond.alpha_bond,
            batchBlocks: updateBond.batch_blocks,
            outcomePayment: updateBond.outcome_payment,
            state: updateBond.state,
            oracleDid: updateBond.oracle_did,
          },
        });
        break;
      case EventTypes.setNextAlphaBond:
        await prisma.bondAlpha.create({
          data: {
            bondDid: getValueFromAttributes(event.attributes, "bond_did"),
            alpha: getValueFromAttributes(event.attributes, "next_alpha"),
            oracleDid: getValueFromAttributes(event.attributes, "signer"),
            height: blockHeight,
            timestamp: timestamp,
          },
        });
        break;
      case EventTypes.buyOrderBond:
        const buyOrder: BuyOrderSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.bondBuy.create({
          data: {
            bondDid: getValueFromAttributes(event.attributes, "bond_did"),
            accountDid: buyOrder.base_order!.account_did,
            amount: buyOrder.base_order!.amount as any,
            maxPrices: buyOrder.max_prices as any,
            height: blockHeight,
            timestamp: timestamp,
          },
        });
        break;
      case EventTypes.sellOrderBond:
        const sellOrder: SellOrderSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.bondSell.create({
          data: {
            bondDid: getValueFromAttributes(event.attributes, "bond_did"),
            accountDid: sellOrder.base_order!.account_did,
            amount: sellOrder.base_order!.amount as any,
            height: blockHeight,
            timestamp: timestamp,
          },
        });
        break;
      case EventTypes.swapOrderBond:
        const swapOrder: SwapOrderSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await prisma.bondSwap.create({
          data: {
            bondDid: getValueFromAttributes(event.attributes, "bond_did"),
            accountDid: swapOrder.base_order!.account_did,
            amount: swapOrder.base_order!.amount as any,
            toToken: swapOrder.to_token,
            height: blockHeight,
            timestamp: timestamp,
          },
        });
        break;
      case EventTypes.outcomePaymentBond:
        await prisma.outcomePayment.create({
          data: {
            bondDid: getValueFromAttributes(event.attributes, "bond_did"),
            senderDid: getValueFromAttributes(event.attributes, "sender_did"),
            senderAddress: getValueFromAttributes(
              event.attributes,
              "sender_address"
            ),
            amount: getValueFromAttributes(event.attributes, "outcome_payment"),
            height: blockHeight,
            timestamp: timestamp,
          },
        });
        break;
      case EventTypes.shareWithdrawalBond:
        await prisma.shareWithdrawal.create({
          data: {
            bondDid: getValueFromAttributes(event.attributes, "bond_did"),
            recipientDid: getValueFromAttributes(
              event.attributes,
              "recipient_did"
            ),
            recipientAddress: getValueFromAttributes(
              event.attributes,
              "recipient_address"
            ),
            amount: getValueFromAttributes(
              event.attributes,
              "withdraw_payment"
            ),
            height: blockHeight,
            timestamp: timestamp,
          },
        });
        break;
      case EventTypes.reserveWithdrawalBond:
        await prisma.reserveWithdrawal.create({
          data: {
            bondDid: getValueFromAttributes(event.attributes, "bond_did"),
            withdrawerDid: getValueFromAttributes(
              event.attributes,
              "withdrawer_did"
            ),
            withdrawerAddress: getValueFromAttributes(
              event.attributes,
              "withdrawer_address"
            ),
            amount: getValueFromAttributes(event.attributes, "withdraw_amount"),
            reserveWithdrawalAddress: getValueFromAttributes(
              event.attributes,
              "reserve_withdrawal_address"
            ),
            height: blockHeight,
            timestamp: timestamp,
          },
        });
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("syncEventData: ", error.message);
  }
};
