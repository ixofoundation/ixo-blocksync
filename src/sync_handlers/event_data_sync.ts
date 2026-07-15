import { EntitySDKType } from "@ixo/impactxclient-sdk/types/codegen/ixo/entity/v1beta1/entity";
import { IidDocumentSDKType } from "@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/iid";
import { EventTypes } from "../types/Event";
import {
  TokenPropertiesSDKType,
  TokenSDKType,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/token/v1beta1/token";
import {
  AgentDepositBalanceSDKType,
  ClaimSDKType,
  CollectionSDKType,
  DisputeSDKType,
  EvaluationSDKType,
  MemberBudgetSDKType,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/claims/v1beta1/claims";
import {
  NameRecordSDKType,
  NamespaceSDKType,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/names/v1beta1/names";
import { PoolSDKType } from "@ixo/impactxclient-sdk/types/codegen/ixo/liquidstake/v1beta1/liquidstake";
import { getDocFromAttributes, getValueFromAttributes } from "../util/helpers";
import { ixo } from "@ixo/impactxclient-sdk";
import {
  BondSDKType,
  BuyOrderSDKType,
  SellOrderSDKType,
  SwapOrderSDKType,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/bonds/v1beta1/bonds";
import { BlockCore, EventCore } from "../postgres/blocksync_core/block";
import { createIid, updateIid } from "../postgres/iid";
import { createEntity, updateEntity } from "../postgres/entity";
import {
  createClaim,
  createClaimCollection,
  createDispute,
  deleteAgentDepositBalance,
  deleteMemberBudget,
  insertEvaluation,
  insertEvaluationHistory,
  resolveDispute,
  updateClaim,
  updateClaimCollection,
  setClaimCurrentEvaluation,
  upsertAgentDepositBalance,
  upsertMemberBudget,
} from "../postgres/claim";
import type { Evaluation } from "../postgres/claim";
import {
  applyNameStatus,
  applyNameTransfer,
  insertNameStatusChange,
  insertNameTransfer,
  upsertNameRecord,
  upsertNamespace,
} from "../postgres/names";
import {
  insertLiquidStakeTx,
  upsertLiquidStakeModuleParams,
  upsertLiquidStakePool,
} from "../postgres/liquidstake";
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
import {
  addAuthenticator,
  removeAuthenticator,
} from "../postgres/smart_account";
import { epochStartedOrEnded } from "../postgres/epoch";
import { smartAccountAuthenticatorQuery } from "../util/archive-queries";

export const syncEventData = async (event: EventCore, block: BlockCore) => {
  const blockHeight = block.height;
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
        await createClaimCollection(collectionFromSdk(cCollection));
        break;
      case EventTypes.updateCollection:
        const uCollection: CollectionSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await updateClaimCollection(collectionFromSdk(uCollection));
        break;
      case EventTypes.submitClaim: {
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
          useIntent: cClaim.use_intent ?? undefined,
          amount: cClaim.amount?.length ? cClaim.amount : undefined,
          cw20Payment: cClaim.cw20_payment,
          cw1155Payment: cClaim.cw1155_payment,
          cw1155IntentPayment: cClaim.cw1155_intent_payment,
          memberAddress: cClaim.member_address || undefined,
        });
        // A submitted claim has no evaluation yet, but evaluation_history
        // may already be populated if this Claim was re-submitted after a
        // prior cycle — replay everything we see (idempotent on conflict).
        if (cClaim.evaluation_history?.length) {
          await insertEvaluationHistory(
            cClaim.evaluation_history.map((e) => evaluationFromSdk(e, cClaim.claim_id))
          );
        }
        break;
      }
      case EventTypes.updateClaim: {
        const uClaim: ClaimSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await updateClaim({
          claimId: uClaim.claim_id,
          collectionId: uClaim.collection_id,
          agentDid: uClaim.agent_did,
          agentAddress: uClaim.agent_address,
          submissionDate: uClaim.submission_date as any,
          paymentsStatus: uClaim.payments_status,
          useIntent: uClaim.use_intent ?? undefined,
          amount: uClaim.amount?.length ? uClaim.amount : undefined,
          cw20Payment: uClaim.cw20_payment,
          cw1155Payment: uClaim.cw1155_payment,
          cw1155IntentPayment: uClaim.cw1155_intent_payment,
          memberAddress: uClaim.member_address || undefined,
        });
        // Insert each historical evaluation, then the current one. Order
        // doesn't matter for correctness (the unique key dedupes), but
        // doing history first keeps event order natural in case anyone
        // later switches to a real `evaluationDate` tiebreak.
        if (uClaim.evaluation_history?.length) {
          await insertEvaluationHistory(
            uClaim.evaluation_history.map((e) => evaluationFromSdk(e, uClaim.claim_id))
          );
        }
        if (uClaim.evaluation) {
          const id = await insertEvaluation(
            evaluationFromSdk(uClaim.evaluation, uClaim.claim_id)
          );
          // Point Claim.currentEvaluationId at this row so the GraphQL
          // singular `Claim.evaluation` keeps resolving to the latest.
          await setClaimCurrentEvaluation(uClaim.claim_id, id);
        }
        break;
      }
      case EventTypes.disputeClaim: {
        const cDispute: DisputeSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        // ClaimDisputedEvent always carries status=OPEN and no resolution;
        // the DisputeResolution row is written by the disputeResolved
        // handler below when the adjudicator settles.
        await createDispute({
          proof: cDispute.data?.proof,
          subjectId: cDispute.subject_id,
          type: Number(cDispute.type ?? 0),
          data: cDispute.data,
          targetRole: enumFrom(cDispute.target_role, DISPUTE_TARGET_ROLE_MAP),
          disputerAddress: cDispute.disputer_address,
          disputerDid: cDispute.disputer_did,
          disputeDeposit: cDispute.dispute_deposit,
          submittedAt: (cDispute.submitted_at as any) ?? block.time,
          status: enumFrom(cDispute.status, DISPUTE_STATUS_MAP),
        });
        break;
      }
      case EventTypes.disputeResolved: {
        const rDispute: DisputeSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        const res = rDispute.resolution;
        if (!res) {
          // Defensive: a resolved event without a resolution payload would
          // mean the chain emitted an inconsistent state. Skip rather than
          // write half a row.
          break;
        }
        await resolveDispute({
          subjectId: rDispute.subject_id,
          targetRole: enumFrom(rDispute.target_role, DISPUTE_TARGET_ROLE_MAP),
          status: enumFrom(rDispute.status, DISPUTE_STATUS_MAP),
          data: rDispute.data,
          resolution: {
            adjudicatorDid: res.adjudicator_did,
            adjudicatorAddress: res.adjudicator_address,
            adjudicatorPayoutAddress: res.adjudicator_payout_address,
            // resolved_at comes from the resolution payload (when
            // adjudicated); fall back to block time so the column is never
            // null on insert.
            resolvedAt: (res.resolved_at as any) ?? block.time,
            data: res.data,
            intendedPenalty: res.intended_penalty,
            actualPenaltyPaid: res.actual_penalty_paid,
            winnerAmount: res.winner_amount,
            adjudicatorAmount: res.adjudicator_amount,
            winnerAddress: res.winner_address,
            loserAddress: res.loser_address,
          },
        });
        break;
      }

      // ==========================================================
      // CLAIMS v7: MEMBER BUDGETS
      // ==========================================================
      case EventTypes.memberBudgetCreated:
      case EventTypes.memberBudgetUpdated: {
        const budget: MemberBudgetSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await upsertMemberBudget({
          collectionId: budget.collection_id,
          memberAddress: budget.member_address,
          periodNs: durationToNanos(budget.period as any),
          periodSpendLimit: budget.period_spend_limit ?? [],
          periodSpent: budget.period_spent ?? [],
          periodCw20SpendLimit: budget.period_cw20_spend_limit,
          periodCw20Spent: budget.period_cw20_spent,
          periodResetAt: (budget.period_reset_at as any) ?? block.time,
          updatedAtHeight: blockHeight,
          updatedAt: block.time,
        });
        break;
      }
      case EventTypes.memberBudgetRemoved: {
        const budget: MemberBudgetSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await deleteMemberBudget(budget.collection_id, budget.member_address);
        break;
      }

      // ==========================================================
      // CLAIMS v7: AGENT PERFORMANCE DEPOSIT BALANCES
      // ==========================================================
      case EventTypes.agentDepositBalanceCreated:
      case EventTypes.agentDepositBalanceUpdated: {
        const balance: AgentDepositBalanceSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await upsertAgentDepositBalance({
          collectionId: balance.collection_id,
          agentAddress: balance.agent_address,
          amount: balance.amount ?? [],
          withdrawableAt: (balance.withdrawable_at as any) ?? block.time,
          updatedAtHeight: blockHeight,
          updatedAt: block.time,
        });
        break;
      }
      case EventTypes.agentDepositBalanceRemoved: {
        const balance: AgentDepositBalanceSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await deleteAgentDepositBalance(
          balance.collection_id,
          balance.agent_address
        );
        break;
      }

      // ==========================================================
      // NAMES MODULE (v7)
      // ==========================================================
      case EventTypes.namespaceCreated:
      case EventTypes.namespaceUpdated: {
        const ns: NamespaceSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        const authority = safeGet(event.attributes, "authority");
        await upsertNamespace({
          name: ns.name,
          description: ns.description,
          registrarAccounts: ns.registrar_accounts ?? [],
          allowSelfRegister: ns.allow_self_register,
          allowRegistrarOverride: ns.allow_registrar_override,
          minLength: Number(ns.min_length ?? 0),
          maxLength: Number(ns.max_length ?? 0),
          regex: ns.regex,
          allowExpiry: ns.allow_expiry,
          authority: authority || undefined,
          createdAtHeight:
            event.type === EventTypes.namespaceCreated ? blockHeight : undefined,
          createdAt:
            event.type === EventTypes.namespaceCreated ? block.time : undefined,
          updatedAtHeight: blockHeight,
          updatedAt: block.time,
        });
        break;
      }
      case EventTypes.nameRegistered:
      case EventTypes.nameUpdated: {
        const record: NameRecordSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await upsertNameRecord({
          namespace: record.namespace,
          normalizedName: record.normalized_name,
          displayName: record.display_name,
          ownerDid: record.owner_did,
          verified: record.verified,
          validUntil: Number(record.valid_until ?? 0),
          status: nameStatusFrom(record.status),
          verifiedBy: record.verified_by || undefined,
          evidenceHash: record.evidence_hash || undefined,
          source: record.source || undefined,
          createdAtUnix: Number(record.created_at ?? 0),
          updatedAtUnix: Number(record.updated_at ?? 0),
          updatedAtHeight: blockHeight,
        });
        break;
      }
      case EventTypes.nameTransferred: {
        const namespace = safeGet(event.attributes, "namespace");
        const normalizedName = safeGet(event.attributes, "normalized_name");
        const fromOwnerDid = safeGet(event.attributes, "from_owner_did");
        const toOwnerDid = safeGet(event.attributes, "to_owner_did");
        const transferredBy = safeGet(event.attributes, "transferred_by");
        await applyNameTransfer({
          namespace,
          normalizedName,
          toOwnerDid,
          height: blockHeight,
        });
        await insertNameTransfer({
          namespace,
          normalizedName,
          fromOwnerDid,
          toOwnerDid,
          transferredBy,
          height: blockHeight,
          timestamp: block.time,
        });
        break;
      }
      case EventTypes.nameStatusChanged: {
        const namespace = safeGet(event.attributes, "namespace");
        const normalizedName = safeGet(event.attributes, "normalized_name");
        const oldStatus = nameStatusFrom(
          safeGet(event.attributes, "old_status")
        );
        const newStatus = nameStatusFrom(
          safeGet(event.attributes, "new_status")
        );
        const changedBy = safeGet(event.attributes, "changed_by");
        const reason = safeGet(event.attributes, "reason");
        await applyNameStatus({
          namespace,
          normalizedName,
          newStatus,
          height: blockHeight,
        });
        await insertNameStatusChange({
          namespace,
          normalizedName,
          oldStatus,
          newStatus,
          changedBy,
          reason: reason || undefined,
          height: blockHeight,
          timestamp: block.time,
        });
        break;
      }

      // ==========================================================
      // LIQUIDSTAKE v7: multi-pool
      // ==========================================================
      case EventTypes.lsModuleParamsUpdated: {
        const mp = getDocFromAttributes(event.attributes, event.type) as {
          min_liquid_stake_amount: string;
          module_paused: boolean;
        };
        await upsertLiquidStakeModuleParams({
          minLiquidStakeAmount: mp.min_liquid_stake_amount,
          modulePaused: mp.module_paused,
          updatedAtHeight: blockHeight,
          updatedAt: block.time,
        });
        break;
      }
      case EventTypes.lsPoolCreated:
      case EventTypes.lsPoolUpdated: {
        const pool: PoolSDKType = getDocFromAttributes(
          event.attributes,
          event.type
        );
        await upsertLiquidStakePool({
          poolId: pool.pool_id,
          liquidBondDenom: pool.liquid_bond_denom,
          proxyAccountAddress: pool.proxy_account_address,
          whitelistedValidators: pool.whitelisted_validators ?? [],
          unstakeFeeRate: pool.unstake_fee_rate,
          feeAccountAddress: pool.fee_account_address,
          autocompoundFeeRate: pool.autocompound_fee_rate,
          whitelistAdminAddress: pool.whitelist_admin_address,
          paused: pool.paused,
          weightedRewardsReceivers: pool.weighted_rewards_receivers ?? [],
          createdAtHeight:
            event.type === EventTypes.lsPoolCreated ? blockHeight : undefined,
          updatedAtHeight: blockHeight,
          updatedAt: block.time,
        });
        break;
      }
      case EventTypes.lsStake:
      case EventTypes.lsUnstake:
      case EventTypes.lsAutoCompound:
      case EventTypes.lsRebalanced:
      case EventTypes.lsAddLiquidValidator: {
        // Per-tx pool activity — all share the same attribute shape (flat
        // typed-event fields). We replay the whole event into `payload` so
        // dashboards can pull denom-specific data without us having to
        // model every field as a separate column.
        const poolId = safeGet(event.attributes, "pool_id");
        const delegator =
          safeGet(event.attributes, "delegator") ||
          safeGet(event.attributes, "validator");
        const payload: Record<string, any> = {};
        for (const attr of event.attributes) {
          try {
            payload[attr.key] = JSON.parse(attr.value);
          } catch {
            payload[attr.key] = attr.value;
          }
        }
        await insertLiquidStakeTx({
          kind: liquidStakeEventKind(event.type as EventTypes),
          poolId,
          delegator: delegator || undefined,
          payload,
          transactionHash: event.transactionHash,
          height: blockHeight,
          timestamp: block.time,
        });
        break;
      }

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
          height: block.height,
          timestamp: block.time,
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
          height: block.height,
          timestamp: block.time,
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
          height: block.height,
          timestamp: block.time,
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
          height: block.height,
          timestamp: block.time,
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
          height: block.height,
          timestamp: block.time,
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
          height: block.height,
          timestamp: block.time,
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
          height: block.height,
          timestamp: block.time,
        });
        break;

      // ==========================================================
      // SMART ACCOUNTS
      // ==========================================================
      case "ixo.smartaccount.v1beta1.AuthenticatorAddedEvent": {
        const authenticatorType = getValueFromAttributes(
          event.attributes,
          "authenticator_type"
        );
        const authenticatorId = getValueFromAttributes(
          event.attributes,
          "authenticator_id"
        );
        const account = getValueFromAttributes(event.attributes, "sender");

        let config: any;

        // Only fetch config for types that need it
        if (
          authenticatorType === "AuthnVerification" ||
          authenticatorType === "SignatureVerification"
        ) {
          try {
            // Use archive API to get the config at the same block height
            const authenticator = await smartAccountAuthenticatorQuery(
              block.height,
              account,
              authenticatorId
            );

            if (!authenticator?.config) {
              throw new Error(
                `No config found for authenticator ${authenticatorId} for account ${account}`
              );
            }

            // Handle different config formats based on authenticator type
            if (authenticatorType === "AuthnVerification") {
              // AuthnVerification config is protobuf-encoded AuthnPubKey
              const configBytes = new Uint8Array(
                Buffer.from(authenticator.config, "base64")
              );
              config = ixo.smartaccount.crypto.AuthnPubKey.decode(configBytes);
            } else if (authenticatorType === "SignatureVerification") {
              // SignatureVerification config is raw secp256k1 public key bytes (not protobuf)
              // Store as hex string for easier querying/display
              const configBytes = Buffer.from(authenticator.config, "base64");
              config = { key: "0x" + configBytes.toString("hex") };
            }
          } catch (error) {
            console.warn(
              `Failed to fetch authenticator ${authenticatorId} for account ${account} at block height ${block.height}: ${error.message}`
            );
            // Continue without config
          }
        }

        await addAuthenticator(
          authenticatorId,
          authenticatorType,
          account,
          config,
          config?.keyId
        );
        break;
      }
      case "ixo.smartaccount.v1beta1.AuthenticatorRemovedEvent": {
        await removeAuthenticator(
          getValueFromAttributes(event.attributes, "authenticator_id"),
          getValueFromAttributes(event.attributes, "sender")
        );
        break;
      }

      // ==========================================================
      // EPOCHS
      // ==========================================================
      case "ixo.epochs.v1beta1.EpochStartEvent": {
        await epochStartedOrEnded({
          epoch_number: Number(
            getValueFromAttributes(event.attributes, "epoch_number")
          ),
          time: getValueFromAttributes(event.attributes, "start_time"),
          height: block.height,
          is_started: true,
        });
        break;
      }
      case "ixo.epochs.v1beta1.EpochEndEvent": {
        await epochStartedOrEnded({
          epoch_number: Number(
            getValueFromAttributes(event.attributes, "epoch_number")
          ),
          time: block.time,
          height: block.height,
          is_started: false,
        });
      }

      default:
        break;
    }
  } catch (error) {
    console.error("ERROR::syncEventData:: ", error);
    throw error;
  }
};

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

// `safeGet` returns the attribute value parsed as JSON when present, or an
// empty string when missing — avoids throwing inside the switch when an
// optional field (e.g. `reason` on NameStatusChange) is absent.
function safeGet(attributes: any[], key: string): string {
  const attr = attributes.find((a) => a.key === key);
  if (!attr || attr.value == null || attr.value === "") return "";
  try {
    const parsed = JSON.parse(attr.value);
    return parsed == null ? "" : String(parsed);
  } catch {
    return String(attr.value);
  }
}

// Convert a cosmos-sdk typed-event Duration to nanoseconds. Duration may
// arrive as either a `"30s"` style protojson string, or a `{seconds, nanos}`
// object — handle both so we don't have to chase upstream changes.
function durationToNanos(d: any): string {
  if (!d) return "0";
  if (typeof d === "string") {
    // protojson form e.g. "30s", "120000s", "2592000s" (30 days)
    const m = d.match(/^(\d+(?:\.\d+)?)s$/);
    if (m) {
      const seconds = Math.floor(Number(m[1]));
      const nanos = Math.round((Number(m[1]) - seconds) * 1e9);
      return (BigInt(seconds) * BigInt(1e9) + BigInt(nanos)).toString();
    }
    // fallback: assume already nanoseconds
    return d;
  }
  const seconds = BigInt(d.seconds ?? 0);
  const nanos = BigInt(d.nanos ?? 0);
  return (seconds * BigInt(1e9) + nanos).toString();
}

// NameStatus may come as either the enum integer or its string name
// ("NAME_STATUS_ACTIVE"). Normalise to the integer used in storage.
const NAME_STATUS_MAP: Record<string, number> = {
  NAME_STATUS_UNSPECIFIED: 0,
  NAME_STATUS_ACTIVE: 1,
  NAME_STATUS_SUSPENDED: 2,
  NAME_STATUS_REVOKED: 3,
  NAME_STATUS_TOMBSTONED: 4,
};
function nameStatusFrom(v: any): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    if (NAME_STATUS_MAP[v] != null) return NAME_STATUS_MAP[v];
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

// Cosmos-sdk typed-event proto enums get JSON-encoded as their full PB string
// name (e.g. "DISPUTE_TARGET_ROLE_EVALUATOR") — `Number(...)` would yield NaN
// and crash the integer column, so map them explicitly.
const DISPUTE_TARGET_ROLE_MAP: Record<string, number> = {
  DISPUTE_TARGET_ROLE_UNSPECIFIED: 0,
  DISPUTE_TARGET_ROLE_SUBMITTER: 1,
  DISPUTE_TARGET_ROLE_EVALUATOR: 2,
};
const DISPUTE_STATUS_MAP: Record<string, number> = {
  DISPUTE_STATUS_OPEN: 0,
  DISPUTE_STATUS_AWARDED: 1,
  DISPUTE_STATUS_DISMISSED: 2,
};
function enumFrom(v: any, map: Record<string, number>): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    if (map[v] != null) return map[v];
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

// CollectionState/IntentOptions can arrive as enum integer or string name —
// the existing helpers throw on unknown strings, so wrap defensively.
function safeCollectionState(v: any): number {
  if (typeof v === "number") return v;
  try {
    return ixo.claims.v1beta1.collectionStateFromJSON(v);
  } catch {
    return 0;
  }
}
function safeCollectionIntents(v: any): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return v;
  try {
    return ixo.claims.v1beta1.collectionIntentOptionsFromJSON(v);
  } catch {
    return undefined;
  }
}

export function collectionFromSdk(c: CollectionSDKType) {
  return {
    id: c.id,
    entity: c.entity,
    admin: c.admin,
    protocol: c.protocol,
    startDate: c.start_date as any,
    endDate: c.end_date as any,
    quota: Number(c.quota),
    count: Number(c.count),
    evaluated: Number(c.evaluated),
    approved: Number(c.approved),
    rejected: Number(c.rejected),
    disputed: Number(c.disputed),
    invalidated: Number(c.invalidated ?? 0),
    state: safeCollectionState(c.state),
    payments: c.payments,
    escrowAccount: c.escrow_account ?? undefined,
    intents: safeCollectionIntents(c.intents),
    // v7 additions
    flagged: Number((c as any).flagged ?? 0),
    flaggedActive: Number((c as any).flagged_active ?? 0),
    serviceAgentDepositRequired: (c as any).service_agent_deposit_required ?? [],
    evaluatorDepositRequired: (c as any).evaluator_deposit_required ?? [],
    disputeDepositAmount: (c as any).dispute_deposit_amount ?? [],
    penaltyAmountPerDispute: (c as any).penalty_amount_per_dispute ?? [],
    disputesOpen: Number((c as any).disputes_open ?? 0),
    disputesAwarded: Number((c as any).disputes_awarded ?? 0),
    disputesDismissed: Number((c as any).disputes_dismissed ?? 0),
    minDepositPeriodNs: durationToNanos((c as any).min_deposit_period),
    adjudicators: (c as any).adjudicators ?? [],
  };
}

// Map a chain-emitted Evaluation (whether the "current" or one from
// evaluation_history) onto the Evaluation row shape. claim_id is always
// supplied by the caller because historical entries omit it.
function evaluationFromSdk(e: EvaluationSDKType, claimId: string): Evaluation {
  return {
    collectionId: e.collection_id,
    oracle: e.oracle,
    agentDid: e.agent_did,
    agentAddress: e.agent_address,
    status: ixo.claims.v1beta1.evaluationStatusFromJSON(e.status),
    reason: Number(e.reason ?? 0),
    verificationProof: e.verification_proof,
    evaluationDate: e.evaluation_date as any,
    amount: e.amount ?? [],
    claimId: e.claim_id || claimId,
    cw20Payment: e.cw20_payment,
    cw1155Payment: e.cw1155_payment,
    cw1155IntentPayment: e.cw1155_intent_payment,
  };
}

function liquidStakeEventKind(t: EventTypes): string {
  switch (t) {
    case EventTypes.lsStake:
      return "stake";
    case EventTypes.lsUnstake:
      return "unstake";
    case EventTypes.lsAutoCompound:
      return "autocompound";
    case EventTypes.lsRebalanced:
      return "rebalance";
    case EventTypes.lsAddLiquidValidator:
      return "addValidator";
    default:
      return "unknown";
  }
}
