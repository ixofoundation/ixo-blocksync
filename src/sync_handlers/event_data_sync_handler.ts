import { EntitySDKType } from "@ixo/impactxclient-sdk/types/codegen/ixo/entity/v1beta1/entity";
import { IidDocumentSDKType } from "@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/iid";
import { EventTypes } from "../types/Event";
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
import { EventCore } from "../postgres/blocksync_core/block";
import { createIid, updateIid } from "../postgres/iid";
import { createEntity, updateEntity } from "../postgres/entity";
import {
  createClaim,
  createClaimCollection,
  createDispute,
  updateClaim,
  updateClaimCollection,
} from "../postgres/claim";
import {
  createBond,
  createBondAlpha,
  createBondBuy,
  createBondSell,
  createBondSwap,
  createOutcomePayment,
  createReserveWithdrawal,
  createShareWithdrawal,
  updateBond,
} from "../postgres/bond";
import {
  createToken,
  createTokenClass,
  updateTokenClass,
} from "../postgres/token";

export const syncEventData = async (
  event: EventCore,
  blockHeight: number,
  timestamp: Date
) => {
  try {
    switch (event.type) {
      // ==========================================================
      // IID
      // ==========================================================
      case EventTypes.createIid:
        const cIid: IidDocumentSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await createIid({
          id: cIid.id,
          controller: cIid.controller,
          authentication: cIid.authentication,
          assertionMethod: cIid.assertionMethod,
          keyAgreement: cIid.keyAgreement,
          capabilityInvocation: cIid.capabilityInvocation,
          capabilityDelegation: cIid.capabilityDelegation,
          alsoKnownAs: cIid.alsoKnownAs,
          verificationMethod: cIid.verificationMethod,
          metadata: cIid.metadata,
          context: cIid.context,
          service: cIid.service,
          linkedResource: cIid.linkedResource,
          linkedClaim: cIid.linkedClaim,
          accordedRight: cIid.accordedRight,
          linkedEntity: cIid.linkedEntity,
        });
        break;
      case EventTypes.updateIid:
        const uIid: IidDocumentSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await updateIid({
          id: uIid.id,
          controller: uIid.controller,
          verificationMethod: uIid.verificationMethod,
          authentication: uIid.authentication,
          assertionMethod: uIid.assertionMethod,
          keyAgreement: uIid.keyAgreement,
          capabilityInvocation: uIid.capabilityInvocation,
          capabilityDelegation: uIid.capabilityDelegation,
          alsoKnownAs: uIid.alsoKnownAs,
          metadata: uIid.metadata,
          context: uIid.context,
          service: uIid.service,
          linkedResource: uIid.linkedResource,
          linkedClaim: uIid.linkedClaim,
          accordedRight: uIid.accordedRight,
          linkedEntity: uIid.linkedEntity,
        });
        break;

      // ==========================================================
      // ENTITY
      // ==========================================================
      case EventTypes.createEntity:
        const cEntity: EntitySDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await createEntity({
          id: cEntity.id,
          type: cEntity.type,
          startDate: cEntity.start_date as any,
          endDate: cEntity.end_date as any,
          status: cEntity.status,
          relayerNode: cEntity.relayer_node,
          credentials: cEntity.credentials,
          entityVerified: cEntity.entity_verified,
          metadata: cEntity.metadata,
          accounts: cEntity.accounts,
        });
        break;
      case EventTypes.updateEntity:
        const uEntity: EntitySDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await updateEntity({
          id: uEntity.id,
          type: uEntity.type,
          startDate: uEntity.start_date as any,
          endDate: uEntity.end_date as any,
          status: uEntity.status,
          relayerNode: uEntity.relayer_node,
          credentials: uEntity.credentials,
          entityVerified: uEntity.entity_verified,
          metadata: uEntity.metadata,
          accounts: uEntity.accounts,
        });
        break;

      // ==========================================================
      // CLAIMS
      // ==========================================================
      case EventTypes.createCollection:
        const cCollection: CollectionSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await createClaimCollection({
          id: cCollection.id,
          entity: cCollection.entity,
          admin: cCollection.admin,
          protocol: cCollection.protocol,
          startDate: cCollection.start_date as any,
          endDate: cCollection.end_date as any,
          quota: Number(cCollection.quota),
          count: Number(cCollection.count),
          evaluated: Number(cCollection.evaluated),
          approved: Number(cCollection.approved),
          rejected: Number(cCollection.rejected),
          disputed: Number(cCollection.disputed),
          invalidated: Number(cCollection.invalidated ?? 0),
          state: ixo.claims.v1beta1.collectionStateFromJSON(cCollection.state),
          payments: cCollection.payments,
        });
        break;
      case EventTypes.updateCollection:
        const uCollection: CollectionSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await updateClaimCollection({
          id: uCollection.id,
          entity: uCollection.entity,
          admin: uCollection.admin,
          protocol: uCollection.protocol,
          startDate: uCollection.start_date as any,
          endDate: uCollection.end_date as any,
          quota: Number(uCollection.quota),
          count: Number(uCollection.count),
          evaluated: Number(uCollection.evaluated),
          approved: Number(uCollection.approved),
          rejected: Number(uCollection.rejected),
          disputed: Number(uCollection.disputed),
          invalidated: Number(uCollection.invalidated ?? 0),
          state: ixo.claims.v1beta1.collectionStateFromJSON(uCollection.state),
          payments: uCollection.payments,
        });
        break;
      case EventTypes.submitClaim:
        const cClaim: ClaimSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await createClaim({
          claimId: cClaim.claim_id,
          collectionId: cClaim.collection_id,
          agentDid: cClaim.agent_did,
          agentAddress: cClaim.agent_address,
          submissionDate: cClaim.submission_date as any,
          paymentsStatus: cClaim.payments_status,
        });
        break;
      case EventTypes.updateClaim:
        const uClaim: ClaimSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        const evaluation = uClaim.evaluation
          ? {
              collectionId: uClaim.evaluation!.collection_id,
              oracle: uClaim.evaluation!.oracle,
              agentDid: uClaim.evaluation!.agent_did,
              agentAddress: uClaim.evaluation!.agent_address,
              status: ixo.claims.v1beta1.evaluationStatusFromJSON(
                uClaim.evaluation!.status
              ),
              reason: uClaim.evaluation!.reason,
              verificationProof: uClaim.evaluation!.verification_proof,
              evaluationDate: uClaim.evaluation!.evaluation_date as any,
              amount: uClaim.evaluation!.amount,
              claimId: uClaim.claim_id,
            }
          : undefined;
        await updateClaim({
          claimId: uClaim.claim_id,
          collectionId: uClaim.collection_id,
          agentDid: uClaim.agent_did,
          agentAddress: uClaim.agent_address,
          submissionDate: uClaim.submission_date as any,
          paymentsStatus: uClaim.payments_status,
          evaluation,
        });
        break;
      case EventTypes.disputeClaim:
        const cDispute: DisputeSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await createDispute({
          proof: cDispute.data!.proof,
          subjectId: cDispute.subject_id,
          type: cDispute.type,
          data: cDispute.data,
        });
        break;

      // ==========================================================
      // TOKEN
      // ==========================================================
      case EventTypes.createToken:
        const cTokenClass: TokenSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await createTokenClass({
          contractAddress: cTokenClass.contract_address,
          minter: cTokenClass.minter,
          class: cTokenClass.class,
          name: cTokenClass.name,
          description: cTokenClass.description,
          image: cTokenClass.image,
          type: cTokenClass.type,
          cap: BigInt(cTokenClass.cap ?? 0),
          supply: BigInt(cTokenClass.supply ?? 0),
          paused: cTokenClass.paused,
          stopped: cTokenClass.stopped,
        });
        break;
      // TODO: check sql and make more efficient by using other events also
      case EventTypes.updateToken:
        const uTokenClass: TokenSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await updateTokenClass({
          contractAddress: uTokenClass.contract_address,
          minter: uTokenClass.minter,
          class: uTokenClass.class,
          name: uTokenClass.name,
          description: uTokenClass.description,
          image: uTokenClass.image,
          type: uTokenClass.type,
          cap: BigInt(uTokenClass.cap ?? 0),
          supply: BigInt(uTokenClass.supply ?? 0),
          paused: uTokenClass.paused,
          stopped: uTokenClass.stopped,
          retired: uTokenClass.retired,
          cancelled: uTokenClass.cancelled,
        });

        break;
      case EventTypes.mintToken:
        const cToken: TokenPropertiesSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await createToken({
          id: cToken.id,
          index: cToken.index,
          collection: cToken.collection,
          name: cToken.name,
          tokenData: cToken.tokenData,
        });
        break;

      // ==========================================================
      // BONDS
      // ==========================================================
      case EventTypes.createBond:
        const cBond: BondSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await createBond({
          token: cBond.token,
          name: cBond.name,
          description: cBond.description,
          creatorDid: cBond.creator_did,
          controllerDid: cBond.controller_did,
          functionType: cBond.function_type,
          functionParameters: cBond.function_parameters,
          reserveTokens: cBond.reserve_tokens,
          txFeePercentage: cBond.tx_fee_percentage,
          exitFeePercentage: cBond.exit_fee_percentage,
          feeAddress: cBond.fee_address,
          reserveWithdrawalAddress: cBond.reserve_withdrawal_address,
          maxSupply: cBond.max_supply,
          orderQuantityLimits: cBond.order_quantity_limits,
          sanityRate: cBond.sanity_rate,
          sanityMarginPercentage: cBond.sanity_margin_percentage,
          currentSupply: cBond.current_supply,
          currentReserve: cBond.current_reserve,
          availableReserve: cBond.available_reserve,
          currentOutcomePaymentReserve: cBond.current_outcome_payment_reserve,
          allowSells: cBond.allow_sells,
          allowReserveWithdrawals: cBond.allow_reserve_withdrawals,
          alphaBond: cBond.alpha_bond,
          batchBlocks: cBond.batch_blocks,
          outcomePayment: cBond.outcome_payment,
          state: cBond.state,
          bondDid: cBond.bond_did,
          oracleDid: cBond.oracle_did,
        });
        break;
      case EventTypes.updateBond:
        const uBond: BondSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await updateBond({
          bondDid: uBond.bond_did,
          token: uBond.token,
          name: uBond.name,
          description: uBond.description,
          creatorDid: uBond.creator_did,
          controllerDid: uBond.controller_did,
          functionType: uBond.function_type,
          functionParameters: uBond.function_parameters,
          reserveTokens: uBond.reserve_tokens,
          txFeePercentage: uBond.tx_fee_percentage,
          exitFeePercentage: uBond.exit_fee_percentage,
          feeAddress: uBond.fee_address,
          reserveWithdrawalAddress: uBond.reserve_withdrawal_address,
          maxSupply: uBond.max_supply,
          orderQuantityLimits: uBond.order_quantity_limits,
          sanityRate: uBond.sanity_rate,
          sanityMarginPercentage: uBond.sanity_margin_percentage,
          currentSupply: uBond.current_supply,
          currentReserve: uBond.current_reserve,
          availableReserve: uBond.available_reserve,
          currentOutcomePaymentReserve: uBond.current_outcome_payment_reserve,
          allowSells: uBond.allow_sells,
          allowReserveWithdrawals: uBond.allow_reserve_withdrawals,
          alphaBond: uBond.alpha_bond,
          batchBlocks: uBond.batch_blocks,
          outcomePayment: uBond.outcome_payment,
          state: uBond.state,
          oracleDid: uBond.oracle_did,
        });
        break;
      case EventTypes.setNextAlphaBond:
        await createBondAlpha({
          bondDid: getValueFromAttributes(event.attributes, "bond_did"),
          alpha: getValueFromAttributes(event.attributes, "next_alpha"),
          oracleDid: getValueFromAttributes(event.attributes, "signer"),
          height: blockHeight,
          timestamp: timestamp,
        });
        break;
      case EventTypes.buyOrderBond:
        const buyOrder: BuyOrderSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await createBondBuy({
          bondDid: getValueFromAttributes(event.attributes, "bond_did"),
          accountDid: buyOrder.base_order!.account_did,
          amount: buyOrder.base_order!.amount,
          maxPrices: buyOrder.max_prices,
          height: blockHeight,
          timestamp: timestamp,
        });
        break;
      case EventTypes.sellOrderBond:
        const sellOrder: SellOrderSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await createBondSell({
          bondDid: getValueFromAttributes(event.attributes, "bond_did"),
          accountDid: sellOrder.base_order!.account_did,
          amount: sellOrder.base_order!.amount,
          height: blockHeight,
          timestamp: timestamp,
        });
        break;
      case EventTypes.swapOrderBond:
        const swapOrder: SwapOrderSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await createBondSwap({
          bondDid: getValueFromAttributes(event.attributes, "bond_did"),
          accountDid: swapOrder.base_order!.account_did,
          amount: swapOrder.base_order!.amount,
          toToken: swapOrder.to_token,
          height: blockHeight,
          timestamp: timestamp,
        });
        break;
      case EventTypes.outcomePaymentBond:
        await createOutcomePayment({
          bondDid: getValueFromAttributes(event.attributes, "bond_did"),
          senderDid: getValueFromAttributes(event.attributes, "sender_did"),
          senderAddress: getValueFromAttributes(
            event.attributes,
            "sender_address"
          ),
          amount: getValueFromAttributes(event.attributes, "outcome_payment"),
          height: blockHeight,
          timestamp: timestamp,
        });
        break;
      case EventTypes.shareWithdrawalBond:
        await createShareWithdrawal({
          bondDid: getValueFromAttributes(event.attributes, "bond_did"),
          recipientDid: getValueFromAttributes(
            event.attributes,
            "recipient_did"
          ),
          recipientAddress: getValueFromAttributes(
            event.attributes,
            "recipient_address"
          ),
          amount: getValueFromAttributes(event.attributes, "withdraw_payment"),
          height: blockHeight,
          timestamp: timestamp,
        });
        break;
      case EventTypes.reserveWithdrawalBond:
        await createReserveWithdrawal({
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
        });
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("ERROR::syncEventData:: ", error);
    // throw error;
  }
};
