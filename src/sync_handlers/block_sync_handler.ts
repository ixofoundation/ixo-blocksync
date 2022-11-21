import * as ProjectHandler from "../handlers/project_handler";
import * as StatHandler from "../handlers/stats_handler";
import * as IidHandler from "../handlers/iid_handler";
import * as BondHandler from "../handlers/bond_handler";
import * as WasmHandler from "../handlers/wasm_handler";
import { MsgTypes } from "../types/Msg";
import * as ProjectTypes from "../types/Project";
import * as IidTypes from "../types/IID";
import { Tx } from "@ixo/impactxclient-sdk/types/codegen/cosmos/tx/v1beta1/tx";
import { decode } from "../util/proto";
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
    MsgUpdateAgent,
    MsgUpdateProjectStatus,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/project/v1/tx";
import {
    MsgBuy,
    MsgCreateBond,
    MsgMakeOutcomePayment,
    MsgSetNextAlpha,
    MsgWithdrawReserve,
    MsgWithdrawShare,
} from "@ixo/impactxclient-sdk/types/codegen/ixo/bonds/v1beta1/tx";

export const syncBlock = async (
    transactions: Tx[],
    blockHeight: string,
    timestamp: string,
) => {
    transactions.forEach(async (tx) => {
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
                        id: String(addVerification.verification?.method?.id),
                        iid: addVerification.id,
                        relationships: addVerification.verification
                            ?.relationships || [""],
                        type: String(
                            addVerification.verification?.method?.type,
                        ),
                        controller: String(
                            addVerification.verification?.method?.controller,
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
                const deleteAccordedRight: MsgDeleteAccordedRight = msg.value;
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
                        type: String(addLinkedResource.linkedResource?.type),
                        description: String(
                            addLinkedResource.linkedResource?.description,
                        ),
                        mediaType: String(
                            addLinkedResource.linkedResource?.mediaType,
                        ),
                        serviceEndpoint: String(
                            addLinkedResource.linkedResource?.serviceEndpoint,
                        ),
                        proof: String(addLinkedResource.linkedResource?.proof),
                        encrypted: String(
                            addLinkedResource.linkedResource?.encrypted,
                        ),
                        right: String(addLinkedResource.linkedResource?.right),
                    },
                    timestamp,
                );
                break;
            case MsgTypes.deleteLinkedResource:
                const deleteLinkedResource: MsgDeleteLinkedResource = msg.value;
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
                let projectDoc = msg.value;
                StatHandler.updateAllStats(
                    MsgTypes.createProject,
                    "",
                    "",
                    projectDoc.data.requiredClaims,
                );
                let pdocs = ProjectTypes.convertProject(projectDoc);
                await ProjectHandler.createProject(
                    pdocs.projectDoc,
                    pdocs.agentDocs,
                    pdocs.claimDocs,
                );
                break;
            case MsgTypes.buy:
                const bondBuy: MsgBuy = msg.value;
                await BondHandler.createTransaction({
                    bondDid: bondBuy.bondDid,
                    buyerDid: bondBuy.buyerDid,
                    amount: String(bondBuy.amount?.amount),
                    maxPrices: bondBuy.maxPrices[0].amount,
                });
                break;
            case MsgTypes.setNextAlpha:
                const setNextAlpha: MsgSetNextAlpha = msg.value;
                await BondHandler.createAlphaChange({
                    bondDid: setNextAlpha.bondDid,
                    rawValue: msg,
                    height: blockHeight,
                    timestamp: timestamp,
                });
                break;
            case MsgTypes.withdrawShare:
                const withdrawShare: MsgWithdrawShare = msg.value;
                await BondHandler.createShareWithdrawal({
                    rawValue: msg,
                    transaction: JSON.stringify(withdrawShare),
                    recipientDid: withdrawShare.recipientDid,
                    bondDid: withdrawShare.bondDid,
                    height: blockHeight,
                    timestamp: timestamp,
                });
                break;
            case MsgTypes.withdrawReserve:
                const withdrawReserve: MsgWithdrawReserve = msg.value;
                await BondHandler.createReserveWithdrawal({
                    rawValue: msg,
                    transaction: JSON.stringify(withdrawReserve),
                    withdrawerDid: withdrawReserve.withdrawerDid,
                    bondDid: withdrawReserve.bondDid,
                    height: blockHeight,
                    timestamp: timestamp,
                });
                break;
            case MsgTypes.makeOutcomePayment:
                const makeOutcomePayment: MsgMakeOutcomePayment = msg.value;
                await BondHandler.createOutcomePayment({
                    rawValue: msg,
                    amount: makeOutcomePayment.amount,
                    senderDid: makeOutcomePayment.senderDid,
                    height: blockHeight,
                    timestamp: timestamp,
                    bondDid: makeOutcomePayment.bondDid,
                });
                break;
            case MsgTypes.createBond:
                const createBond: MsgCreateBond = msg.value;
                await BondHandler.createBond({
                    bondDid: createBond.bondDid,
                    token: createBond.token,
                    name: createBond.name,
                    description: createBond.description,
                    creatorDid: createBond.creatorDid,
                });
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
                await StatHandler.updateAllStats(MsgTypes.createClaim, "", "0");
                await ProjectHandler.addClaim({
                    claimId: String(createClaim.data?.claimId),
                    claimTemplateId: String(createClaim.data?.claimTemplateId),
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
            case MsgTypes.updateProjectStatus:
                const updateProjectStatus: MsgUpdateProjectStatus = msg.value;
                await ProjectHandler.updateProjectStatus(
                    updateProjectStatus.projectDid,
                    String(updateProjectStatus.data?.status.toUpperCase()),
                );
                break;
            case MsgTypes.updateProjectDoc:
                await ProjectHandler.updateProject(
                    msg.value.projectDid,
                    msg.value.data,
                );
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
    });
};
