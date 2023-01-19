import * as ProjectHandler from "../handlers/project_handler";
import * as StatHandler from "../handlers/stats_handler";
import * as IidHandler from "../handlers/iid_handler";
import * as BondHandler from "../handlers/bond_handler";
import * as PaymentHandler from "../handlers/payment_handler";
import * as WasmHandler from "../handlers/wasm_handler";
import { MsgTypes } from "../types/Msg";
import * as IidTypes from "../types/IID";
import { Tx } from "@ixo/impactxclient-sdk/types/codegen/cosmos/tx/v1beta1/tx";
import { decode, Uint8ArrayToJS } from "../util/proto";
import {
    MsgAddAccordedRight,
    MsgAddIidContext,
    MsgAddLinkedEntity,
    MsgAddLinkedResource,
    MsgAddService,
    MsgAddVerification,
    MsgCreateIidDocument,
    MsgDeleteAccordedRight,
    MsgDeleteIidContext,
    MsgDeleteLinkedEntity,
    MsgDeleteLinkedResource,
    MsgDeleteService,
    MsgRevokeVerification,
    MsgSetVerificationRelationships,
    MsgUpdateIidDocument,
    MsgUpdateIidMeta,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/iid/v1beta1/tx";
import {
    MsgCreateAgent,
    MsgCreateClaim,
    MsgCreateEvaluation,
    MsgCreateProject,
    MsgUpdateAgent,
    MsgUpdateProjectDoc,
    MsgUpdateProjectStatus,
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
    transactions.forEach(async (tx) => {
        try {
            const msg = {
                type: tx.body?.messages[0].typeUrl,
                value: await decode(tx.body?.messages[0]),
            };
            const type = msg.type;
            switch (type) {
                case MsgTypes.createIid:
                    const createIid: MsgCreateIidDocument = msg.value;
                    const idocs = IidTypes.convertIID(createIid);
                    await IidHandler.createIid(
                        {
                            id: createIid.id,
                            updated: timestamp,
                            created: timestamp,
                            Controller: createIid.controllers,
                            Context: JSON.stringify(createIid.context),
                        },
                        idocs.verificationMethodDocs,
                        idocs.serviceDocs,
                        idocs.accordedRightDocs,
                        idocs.linkedResourceDocs,
                        idocs.linkedEntityDocs,
                    );
                    break;
                case MsgTypes.updateIid:
                    const updateIid: MsgUpdateIidDocument = msg.value;
                    await IidHandler.updateIid(
                        String(updateIid.doc?.id),
                        updateIid.doc?.controller || [""],
                        timestamp,
                    );
                    break;
                case MsgTypes.addVerification:
                    const addVerification: MsgAddVerification = msg.value;
                    await IidHandler.addVerification(
                        {
                            id: String(
                                addVerification.verification?.method?.id,
                            ),
                            iid: addVerification.id,
                            relationships: addVerification.verification
                                ?.relationships || [""],
                            type: String(
                                addVerification.verification?.method?.type,
                            ),
                            controller: String(
                                addVerification.verification?.method
                                    ?.controller,
                            ),
                            verificationMaterial:
                                String(
                                    addVerification.verification?.method
                                        ?.blockchainAccountID,
                                ) ||
                                String(
                                    addVerification.verification?.method
                                        ?.publicKeyHex,
                                ) ||
                                String(
                                    addVerification.verification?.method
                                        ?.publicKeyMultibase,
                                ),
                        },
                        timestamp,
                    );
                    break;
                case MsgTypes.setVerificationRelationships:
                    const setVerificationRelationships: MsgSetVerificationRelationships =
                        msg.value;
                    await IidHandler.setVerificationRelationships(
                        setVerificationRelationships.methodId,
                        setVerificationRelationships.relationships,
                        timestamp,
                    );
                    break;
                case MsgTypes.revokeVerification:
                    const revokeVerification: MsgRevokeVerification = msg.value;
                    await IidHandler.revokeVerification(
                        revokeVerification.methodId,
                        timestamp,
                    );
                    break;
                case MsgTypes.addService:
                    const addService: MsgAddService = msg.value;
                    await IidHandler.addService(
                        {
                            id: String(addService.serviceData?.id),
                            iid: addService.id,
                            type: String(addService.serviceData?.type),
                            serviceEndpoint: String(
                                addService.serviceData?.serviceEndpoint,
                            ),
                        },
                        timestamp,
                    );
                    break;
                case MsgTypes.deleteService:
                    const deleteService: MsgDeleteService = msg.value;
                    await IidHandler.deleteService(
                        deleteService.serviceId,
                        timestamp,
                    );
                    break;
                case MsgTypes.addAccordedRight:
                    const addAccordedRight: MsgAddAccordedRight = msg.value;
                    await IidHandler.addAccordedRight(
                        {
                            iid: addAccordedRight.id,
                            id: String(addAccordedRight.accordedRight?.id),
                            type: String(addAccordedRight.accordedRight?.type),
                            mechanism: String(
                                addAccordedRight.accordedRight?.mechanism,
                            ),
                            service: String(
                                addAccordedRight.accordedRight?.service,
                            ),
                        },
                        timestamp,
                    );
                    break;
                case MsgTypes.deleteAccordedRight:
                    const deleteAccordedRight: MsgDeleteAccordedRight =
                        msg.value;
                    await IidHandler.deleteAccordedRight(
                        deleteAccordedRight.rightId,
                        timestamp,
                    );
                    break;
                case MsgTypes.addLinkedEntity:
                    const addLinkedEntity: MsgAddLinkedEntity = msg.value;
                    await IidHandler.addLinkedEntity(
                        {
                            iid: addLinkedEntity.id,
                            id: String(addLinkedEntity.linkedEntity?.id),
                            relationship: String(
                                addLinkedEntity.linkedEntity?.relationship,
                            ),
                        },
                        timestamp,
                    );
                    break;
                case MsgTypes.deleteLinkedEntity:
                    const deleteLinkedEntity: MsgDeleteLinkedEntity = msg.value;
                    await IidHandler.deleteLinkedEntity(
                        deleteLinkedEntity.entityId,
                        timestamp,
                    );
                    break;
                case MsgTypes.addLinkedResource:
                    const addLinkedResource: MsgAddLinkedResource = msg.value;
                    await IidHandler.addLinkedResource(
                        {
                            iid: addLinkedResource.id,
                            id: String(addLinkedResource.linkedResource?.id),
                            type: String(
                                addLinkedResource.linkedResource?.type,
                            ),
                            description: String(
                                addLinkedResource.linkedResource?.description,
                            ),
                            mediaType: String(
                                addLinkedResource.linkedResource?.mediaType,
                            ),
                            serviceEndpoint: String(
                                addLinkedResource.linkedResource
                                    ?.serviceEndpoint,
                            ),
                            proof: String(
                                addLinkedResource.linkedResource?.proof,
                            ),
                            encrypted: String(
                                addLinkedResource.linkedResource?.encrypted,
                            ),
                            right: String(
                                addLinkedResource.linkedResource?.right,
                            ),
                        },
                        timestamp,
                    );
                    break;
                case MsgTypes.deleteLinkedResource:
                    const deleteLinkedResource: MsgDeleteLinkedResource =
                        msg.value;
                    await IidHandler.deleteLinkedResource(
                        deleteLinkedResource.resourceId,
                        timestamp,
                    );
                    break;
                case MsgTypes.addContext:
                    const addContext: MsgAddIidContext = msg.value;
                    await IidHandler.addContext(
                        { id: addContext.id, context: addContext.context },
                        timestamp,
                    );
                    break;
                case MsgTypes.deleteContext:
                    const deleteContext: MsgDeleteIidContext = msg.value;
                    await IidHandler.deleteContext(
                        deleteContext.id,
                        deleteContext.contextKey,
                        timestamp,
                    );
                    break;
                case MsgTypes.updateMetadata:
                    const updateMetadata: MsgUpdateIidMeta = msg.value;
                    await IidHandler.updateMetadata(
                        updateMetadata.id,
                        updateMetadata.meta,
                    );
                    break;
                case MsgTypes.createProject:
                    const createProject: MsgCreateProject = msg.value;
                    const obj = Uint8ArrayToJS(createProject.data);
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
                        status: projectData.status ?? "",
                        entityType: projectData.entityType ?? "",
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
                        String(updateProjectStatus.data?.status.toUpperCase()),
                    );
                    break;
                case MsgTypes.updateProjectDoc:
                    const updateProject: MsgUpdateProjectDoc = msg.value;
                    const obj1 = Uint8ArrayToJS(updateProject.data);
                    console.log("After Uint8ArrayToJS: ", obj1);
                    const updateProjectData = JSON.parse(obj1);
                    console.log("After JSON.parse: ", updateProjectData);
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
                        agentDid: String(createAgent.data?.agentDid),
                        projectDid: createAgent.projectDid,
                        role: String(createAgent.data?.role),
                        status: "0",
                    });
                    await ProjectHandler.updateAgentStats(
                        createAgent.projectDid,
                        "0",
                        String(createAgent.data?.role),
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
                        String(updateAgent.projectDid),
                        String(updateAgent.data?.did),
                        String(updateAgent.data?.status),
                    );
                    await ProjectHandler.updateAgentStats(
                        updateAgent.projectDid,
                        String(updateAgent.data?.status),
                        String(updateAgent.data?.role),
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
                        claimId: String(createClaim.data?.claimId),
                        claimTemplateId: String(
                            createClaim.data?.claimTemplateId,
                        ),
                        projectDid: createClaim.projectDid,
                        status: "0",
                    });
                    break;
                case MsgTypes.evaluateClaim:
                    const evaluateClaim: MsgCreateEvaluation = msg.value;
                    await StatHandler.updateAllStats(
                        MsgTypes.evaluateClaim,
                        "",
                        evaluateClaim.data?.status,
                    );
                    await ProjectHandler.updateClaimStatus(
                        String(evaluateClaim.data?.claimId),
                        String(evaluateClaim.data?.status),
                    );
                    await ProjectHandler.updateClaimStats(
                        evaluateClaim.projectDid,
                        String(evaluateClaim.data?.status),
                    );
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
                        orderQuantityLimits: editBond.orderQuantityLimits,
                        sanityRate: editBond.sanityRate,
                        sanityMarginPercentage: editBond.sanityMarginPercentage,
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
                    const updateBondState: MsgUpdateBondState = msg.value;
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
                        amount: String(bondBuy.amount?.amount),
                        maxPrices: JSON.stringify(bondBuy.maxPrices),
                    });
                    break;
                case MsgTypes.sell:
                    const bondSell: MsgSell = msg.value;
                    await BondHandler.createSell({
                        bondDid: bondSell.bondDid,
                        sellerDid: bondSell.sellerDid,
                        sellerAddress: bondSell.sellerAddress,
                        amount: String(bondSell.amount?.amount),
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
                    const makeOutcomePayment: MsgMakeOutcomePayment = msg.value;
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
                        recipientAddress: withdrawShare.recipientAddress,
                        height: blockHeight,
                        timestamp: timestamp,
                    });
                    break;
                case MsgTypes.withdrawReserve:
                    const withdrawReserve: MsgWithdrawReserve = msg.value;
                    await BondHandler.createReserveWithdrawal({
                        bondDid: withdrawReserve.bondDid,
                        withdrawerDid: withdrawReserve.withdrawerDid,
                        withdrawerAddress: withdrawReserve.withdrawerAddress,
                        amount: JSON.stringify(withdrawReserve.amount),
                        height: blockHeight,
                        timestamp: timestamp,
                    });
                    break;
                case MsgTypes.createPaymentTemplate:
                    const createPaymentTemplate: MsgCreatePaymentTemplate =
                        msg.value;
                    await PaymentHandler.createPaymentTemplate({
                        id: String(createPaymentTemplate.paymentTemplate?.id),
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
                            createPaymentTemplate.paymentTemplate?.discounts,
                        ),
                        creatorDid: createPaymentTemplate.creatorDid,
                        creatorAddress: createPaymentTemplate.creatorAddress,
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
                        canDeauthorise: createPaymentContract.canDeauthorise,
                        creatorDid: createPaymentContract.creatorDid,
                        creatorAddress: createPaymentContract.creatorAddress,
                    });
                    break;
                case MsgTypes.createSubscription:
                    const createSubscription: MsgCreateSubscription = msg.value;
                    await PaymentHandler.createSubscription({
                        id: createSubscription.subscriptionId,
                        paymentContractId: createSubscription.paymentContractId,
                        maxPeriods: createSubscription.maxPeriods,
                        period: JSON.stringify(createSubscription.period),
                        creatorDid: createSubscription.creatorDid,
                        creatorAddress: createSubscription.creatorAddress,
                    });
                    break;
                case MsgTypes.setPaymentContractAuthorisation:
                    const setPaymentContractAuthorisation: MsgSetPaymentContractAuthorisation =
                        msg.value;
                    await PaymentHandler.setPaymentContractAuthorisation({
                        id: setPaymentContractAuthorisation.paymentContractId,
                        authorised: setPaymentContractAuthorisation.authorised,
                        payerDid: setPaymentContractAuthorisation.payerDid,
                    });
                    break;
                case MsgTypes.grantDiscount:
                    const grantDiscount: MsgGrantDiscount = msg.value;
                    await PaymentHandler.grantDiscount({
                        id: grantDiscount.discountId,
                        paymentContractId: grantDiscount.paymentContractId,
                        recipient: grantDiscount.recipient,
                        granter: grantDiscount.senderDid,
                    });
                    break;
                case MsgTypes.revokeDiscount:
                    const revokeDiscount: MsgRevokeDiscount = msg.value;
                    await PaymentHandler.revokeDiscount({
                        senderDid: revokeDiscount.senderDid,
                        paymentContractId: revokeDiscount.paymentContractId,
                        holder: revokeDiscount.holder,
                    });
                    break;
                case MsgTypes.effectPayment:
                    const effectPayment: MsgEffectPayment = msg.value;
                    await PaymentHandler.effectPayment({
                        senderDid: effectPayment.senderDid,
                        paymentContractId: effectPayment.paymentContractId,
                    });
                    break;
                case MsgTypes.storeCode:
                    // await WasmHandler.createWasmCode({
                    //     index: 1,
                    //     creator: value.sender,
                    //     creation_time: timestamp,
                    //     height: Number(blockHeight),
                    // });
                    break;
                case MsgTypes.instantiateContract:
                    // await WasmHandler.createWasmContract({
                    //     address: "",
                    //     code_id: 1,
                    //     creator: "",
                    //     admin: "",
                    //     label: "",
                    //     creation_time: "",
                    //     height: 1,
                    //     json: {},
                    // });
                    break;
                case MsgTypes.migrateContract:
                    // await WasmHandler.updateWasmContractCodeId("addr", 1);
                    break;
                case MsgTypes.clearAdmin:
                    // await WasmHandler.updateWasmContractAdmin("addr", "");
                    break;
                case MsgTypes.updateAdmin:
                    // await WasmHandler.updateWasmContractAdmin("addr", "admin");
                    break;
                case MsgTypes.executeContract:
                    // await WasmHandler.createExecMsg({
                    //     sender: "",
                    //     address: "",
                    //     funds: {},
                    //     json: {},
                    // });
                    break;
            }
        } catch (error) {
            console.log(error);
        }
    });
};
