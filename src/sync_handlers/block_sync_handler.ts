import * as ProjectHandler from "../handlers/project_handler";
import * as StatHandler from "../handlers/stats_handler";
import * as BondHandler from "../handlers/bond_handler";
import * as PaymentHandler from "../handlers/payment_handler";
import { MsgTypes } from "../types/Msg";
import { Tx } from "@ixo/impactxclient-sdk/types/codegen/cosmos/tx/v1beta1/tx";
import { createRegistry, utils } from "@ixo/impactxclient-sdk";
import {
    MsgCreateAgent,
    MsgCreateClaim,
    MsgCreateEvaluation,
    MsgCreateProject,
    MsgUpdateAgent,
    MsgUpdateProjectDoc,
    MsgUpdateProjectStatus,
    MsgWithdrawFunds,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/project/v1/tx";
import {
    MsgBuy,
    MsgCreateBond,
    MsgEditBond,
    MsgMakeOutcomePayment,
    MsgSell,
    MsgSetNextAlpha,
    MsgSwap,
    MsgUpdateBondState,
    MsgWithdrawReserve,
    MsgWithdrawShare,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/bonds/v1beta1/tx";
import {
    MsgCreatePaymentContract,
    MsgCreatePaymentTemplate,
    MsgCreateSubscription,
    MsgEffectPayment,
    MsgGrantDiscount,
    MsgRevokeDiscount,
    MsgSetPaymentContractAuthorisation,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/payments/v1/tx";

export const syncBlock = async (
    transactions: Tx[],
    blockHeight: string,
    timestamp: string,
) => {
    for (const tx of transactions) {
        try {
            for (const message of tx.body?.messages || []) {
                try {
                    const registry = createRegistry();
                    const msg = {
                        type: message.typeUrl,
                        value: await registry.decode(message),
                    };
                    switch (msg.type) {
                        case MsgTypes.createProject:
                            const createProject: MsgCreateProject = msg.value;
                            const obj = utils.conversions.Uint8ArrayToJS(
                                createProject.data,
                            );
                            console.log("After Uint8ArrayToJS: ", obj);
                            const projectData = JSON.parse(obj);
                            console.log("After JSON.parse: ", projectData);
                            await ProjectHandler.createProject({
                                projectDid: createProject.projectDid,
                                txHash: createProject.txHash,
                                senderDid: createProject.senderDid,
                                pubKey: createProject.pubKey,
                                data: JSON.stringify(projectData),
                                projectAddress: createProject.projectAddress,
                                status: projectData.status || "",
                                entityType: projectData.entityType || "",
                                createdOn: new Date(projectData.createdOn),
                                createdBy: projectData.createdBy,
                                successfulClaims: 0,
                                rejectedClaims: 0,
                                evaluators: 0,
                                evaluatorsPending: 0,
                                serviceProviders: 0,
                                serviceProvidersPending: 0,
                                investors: 0,
                                investorsPending: 0,
                            });
                            StatHandler.updateAllStats(
                                MsgTypes.createProject,
                                "",
                                "",
                                projectData.requiredClaims,
                            );
                            break;
                        case MsgTypes.updateProjectStatus:
                            const updateProjectStatus: MsgUpdateProjectStatus =
                                msg.value;
                            await ProjectHandler.updateProjectStatus(
                                updateProjectStatus.projectDid,
                                updateProjectStatus.data?.status.toUpperCase() ||
                                    "",
                            );
                            break;
                        case MsgTypes.updateProjectDoc:
                            const updateProject: MsgUpdateProjectDoc =
                                msg.value;
                            const obj1 = utils.conversions.Uint8ArrayToJS(
                                updateProject.data,
                            );
                            console.log("After Uint8ArrayToJS: ", obj1);
                            const updateProjectData = JSON.parse(obj1);
                            console.log(
                                "After JSON.parse: ",
                                updateProjectData,
                            );
                            await ProjectHandler.updateProject(
                                updateProject.projectDid,
                                JSON.stringify(updateProjectData),
                            );
                            break;
                        case MsgTypes.createAgent:
                            const createAgent: MsgCreateAgent = msg.value;
                            await StatHandler.updateAllStats(
                                MsgTypes.createAgent,
                                createAgent.data?.role,
                            );
                            await ProjectHandler.addAgent({
                                agentDid: createAgent.data?.agentDid || "",
                                projectDid: createAgent.projectDid,
                                role: createAgent.data?.role || "",
                                status: "0",
                            });
                            await ProjectHandler.updateAgentStats(
                                createAgent.projectDid,
                                "0",
                                createAgent.data?.role || "",
                            );
                            break;
                        case MsgTypes.updateAgent:
                            const updateAgent: MsgUpdateAgent = msg.value;
                            if (updateAgent.data?.status === "1")
                                await StatHandler.updateAllStats(
                                    MsgTypes.updateAgent,
                                    updateAgent.data.role,
                                );
                            await ProjectHandler.updateAgentStatus(
                                updateAgent.projectDid || "",
                                updateAgent.data?.did || "",
                                updateAgent.data?.status || "",
                            );
                            await ProjectHandler.updateAgentStats(
                                updateAgent.projectDid,
                                updateAgent.data?.status || "",
                                updateAgent.data?.role || "",
                            );
                            break;
                        case MsgTypes.createClaim:
                            const createClaim: MsgCreateClaim = msg.value;
                            await StatHandler.updateAllStats(
                                MsgTypes.createClaim,
                                "",
                                "0",
                            );
                            await ProjectHandler.addClaim({
                                claimId: createClaim.data?.claimId || "",
                                claimTemplateId:
                                    createClaim.data?.claimTemplateId || "",
                                projectDid: createClaim.projectDid,
                                status: "0",
                            });
                            break;
                        case MsgTypes.evaluateClaim:
                            const evaluateClaim: MsgCreateEvaluation =
                                msg.value;
                            await StatHandler.updateAllStats(
                                MsgTypes.evaluateClaim,
                                "",
                                evaluateClaim.data?.status,
                            );
                            await ProjectHandler.updateClaimStatus(
                                evaluateClaim.data?.claimId || "",
                                evaluateClaim.data?.status || "",
                            );
                            await ProjectHandler.updateClaimStats(
                                evaluateClaim.projectDid,
                                evaluateClaim.data?.status || "",
                            );
                            break;
                        case MsgTypes.withdrawFunds:
                            const withdrawFunds: MsgWithdrawFunds = msg.value;
                            await ProjectHandler.withdrawFunds({
                                projectDid:
                                    withdrawFunds.data?.projectDid || "",
                                senderDid: withdrawFunds.senderDid,
                                senderAddress: withdrawFunds.senderAddress,
                                recipientDid:
                                    withdrawFunds.data?.recipientDid || "",
                                amount: withdrawFunds.data?.amount || "",
                                isRefund: withdrawFunds.data?.isRefund,
                            });
                            break;
                        case MsgTypes.createBond:
                            const createBond: MsgCreateBond = msg.value;
                            await BondHandler.createBond({
                                bondDid: createBond.bondDid,
                                token: createBond.token,
                                name: createBond.name,
                                description: createBond.description,
                                functionType: createBond.functionType,
                                functionParamaters: JSON.stringify(
                                    createBond.functionParameters,
                                ),
                                creatorDid: createBond.creatorDid,
                                controllerDid: createBond.controllerDid,
                                reserveTokens: createBond.reserveTokens,
                                txFeePercentage: createBond.txFeePercentage,
                                exitFeePercentage: createBond.exitFeePercentage,
                                feeAddress: createBond.feeAddress,
                                reserveWithdrawalAddress:
                                    createBond.reserveWithdrawalAddress,
                                maxSupply: JSON.stringify(createBond.maxSupply),
                                orderQuantityLimits: JSON.stringify(
                                    createBond.orderQuantityLimits,
                                ),
                                sanityRate: createBond.sanityRate,
                                sanityMarginPercentage:
                                    createBond.sanityMarginPercentage,
                                allowSells: createBond.allowSells,
                                allowReserveWithdrawals:
                                    createBond.allowReserveWithdrawals,
                                alphaBond: createBond.alphaBond,
                                batchBlocks: createBond.batchBlocks,
                                creatorAddress: createBond.creatorAddress,
                            });
                            break;
                        case MsgTypes.editBond:
                            const editBond: MsgEditBond = msg.value;
                            await BondHandler.editBond({
                                bondDid: editBond.bondDid,
                                name: editBond.name,
                                description: editBond.description,
                                orderQuantityLimits:
                                    editBond.orderQuantityLimits,
                                sanityRate: editBond.sanityRate,
                                sanityMarginPercentage:
                                    editBond.sanityMarginPercentage,
                                editorDid: editBond.editorDid,
                                editorAddress: editBond.editorAddress,
                            });
                        case MsgTypes.setNextAlpha:
                            const setNextAlpha: MsgSetNextAlpha = msg.value;
                            await BondHandler.createAlpha({
                                bondDid: setNextAlpha.bondDid,
                                alpha: setNextAlpha.alpha,
                                delta: setNextAlpha.delta,
                                oracleDid: setNextAlpha.oracleDid,
                                oracleAddress: setNextAlpha.oracleAddress,
                                height: blockHeight,
                                timestamp: timestamp,
                            });
                            break;
                        case MsgTypes.updateBondState:
                            const updateBondState: MsgUpdateBondState =
                                msg.value;
                            await BondHandler.updateBondState({
                                bondDid: updateBondState.bondDid,
                                status: updateBondState.state,
                                editorDid: updateBondState.editorDid,
                                editorAddress: updateBondState.editorAddress,
                            });
                            break;
                        case MsgTypes.buy:
                            const bondBuy: MsgBuy = msg.value;
                            await BondHandler.createBuy({
                                bondDid: bondBuy.bondDid,
                                buyerDid: bondBuy.buyerDid,
                                buyerAddress: bondBuy.buyerAddress,
                                amount: bondBuy.amount?.amount || "",
                                maxPrices: JSON.stringify(bondBuy.maxPrices),
                            });
                            break;
                        case MsgTypes.sell:
                            const bondSell: MsgSell = msg.value;
                            await BondHandler.createSell({
                                bondDid: bondSell.bondDid,
                                sellerDid: bondSell.sellerDid,
                                sellerAddress: bondSell.sellerAddress,
                                amount: bondSell.amount?.amount || "",
                            });
                        case MsgTypes.swap:
                            const bondSwap: MsgSwap = msg.value;
                            await BondHandler.createSwap({
                                bondDid: bondSwap.bondDid,
                                swapperDid: bondSwap.swapperAddress,
                                swapperAddress: bondSwap.swapperAddress,
                                from: JSON.stringify(bondSwap.from),
                                toToken: bondSwap.toToken,
                            });
                            break;
                        case MsgTypes.makeOutcomePayment:
                            const makeOutcomePayment: MsgMakeOutcomePayment =
                                msg.value;
                            await BondHandler.createOutcomePayment({
                                bondDid: makeOutcomePayment.bondDid,
                                senderDid: makeOutcomePayment.senderDid,
                                senderAddress: makeOutcomePayment.senderAddress,
                                amount: makeOutcomePayment.amount,
                                height: blockHeight,
                                timestamp: timestamp,
                            });
                            break;
                        case MsgTypes.withdrawShare:
                            const withdrawShare: MsgWithdrawShare = msg.value;
                            await BondHandler.createShareWithdrawal({
                                bondDid: withdrawShare.bondDid,
                                recipientDid: withdrawShare.recipientDid,
                                recipientAddress:
                                    withdrawShare.recipientAddress,
                                height: blockHeight,
                                timestamp: timestamp,
                            });
                            break;
                        case MsgTypes.withdrawReserve:
                            const withdrawReserve: MsgWithdrawReserve =
                                msg.value;
                            await BondHandler.createReserveWithdrawal({
                                bondDid: withdrawReserve.bondDid,
                                withdrawerDid: withdrawReserve.withdrawerDid,
                                withdrawerAddress:
                                    withdrawReserve.withdrawerAddress,
                                amount: JSON.stringify(withdrawReserve.amount),
                                height: blockHeight,
                                timestamp: timestamp,
                            });
                            break;
                        case MsgTypes.createPaymentTemplate:
                            const createPaymentTemplate: MsgCreatePaymentTemplate =
                                msg.value;
                            await PaymentHandler.createPaymentTemplate({
                                id:
                                    createPaymentTemplate.paymentTemplate?.id ||
                                    "",
                                paymentAmount: JSON.stringify(
                                    createPaymentTemplate.paymentTemplate
                                        ?.paymentAmount,
                                ),
                                paymentMinimum: JSON.stringify(
                                    createPaymentTemplate.paymentTemplate
                                        ?.paymentMinimum,
                                ),
                                paymentMaximum: JSON.stringify(
                                    createPaymentTemplate.paymentTemplate
                                        ?.paymentMaximum,
                                ),
                                discounts: JSON.stringify(
                                    createPaymentTemplate.paymentTemplate
                                        ?.discounts,
                                ),
                                creatorDid: createPaymentTemplate.creatorDid,
                                creatorAddress:
                                    createPaymentTemplate.creatorAddress,
                            });
                            break;
                        case MsgTypes.createPaymentContract:
                            const createPaymentContract: MsgCreatePaymentContract =
                                msg.value;
                            await PaymentHandler.createPaymentContract({
                                id: createPaymentContract.paymentContractId,
                                paymentTemplateId:
                                    createPaymentContract.paymentTemplateId,
                                payer: createPaymentContract.payer,
                                recipients: JSON.stringify(
                                    createPaymentContract.recipients,
                                ),
                                canDeauthorise:
                                    createPaymentContract.canDeauthorise,
                                creatorDid: createPaymentContract.creatorDid,
                                creatorAddress:
                                    createPaymentContract.creatorAddress,
                            });
                            break;
                        case MsgTypes.createSubscription:
                            const createSubscription: MsgCreateSubscription =
                                msg.value;
                            await PaymentHandler.createSubscription({
                                id: createSubscription.subscriptionId,
                                paymentContractId:
                                    createSubscription.paymentContractId,
                                maxPeriods: createSubscription.maxPeriods,
                                period: JSON.stringify(
                                    createSubscription.period,
                                ),
                                creatorDid: createSubscription.creatorDid,
                                creatorAddress:
                                    createSubscription.creatorAddress,
                            });
                            break;
                        case MsgTypes.setPaymentContractAuthorisation:
                            const setPaymentContractAuthorisation: MsgSetPaymentContractAuthorisation =
                                msg.value;
                            await PaymentHandler.setPaymentContractAuthorisation(
                                {
                                    id: setPaymentContractAuthorisation.paymentContractId,
                                    authorised:
                                        setPaymentContractAuthorisation.authorised,
                                    payerDid:
                                        setPaymentContractAuthorisation.payerDid,
                                },
                            );
                            break;
                        case MsgTypes.grantDiscount:
                            const grantDiscount: MsgGrantDiscount = msg.value;
                            await PaymentHandler.grantDiscount({
                                id: grantDiscount.discountId,
                                paymentContractId:
                                    grantDiscount.paymentContractId,
                                recipient: grantDiscount.recipient,
                                granter: grantDiscount.senderDid,
                            });
                            break;
                        case MsgTypes.revokeDiscount:
                            const revokeDiscount: MsgRevokeDiscount = msg.value;
                            await PaymentHandler.revokeDiscount({
                                senderDid: revokeDiscount.senderDid,
                                paymentContractId:
                                    revokeDiscount.paymentContractId,
                                holder: revokeDiscount.holder,
                            });
                            break;
                        case MsgTypes.effectPayment:
                            const effectPayment: MsgEffectPayment = msg.value;
                            await PaymentHandler.effectPayment({
                                senderDid: effectPayment.senderDid,
                                paymentContractId:
                                    effectPayment.paymentContractId,
                            });
                            break;
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
};
