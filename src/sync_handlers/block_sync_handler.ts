import * as ProjectHandler from "../handlers/project_handler";
import * as StatHandler from "../handlers/stats_handler";
import * as IidHandler from "../handlers/iid_handler";
import * as DidHandler from "../handlers/did_handler";
import * as BondHandler from "../handlers/bond_handler";
import * as WasmHandler from "../handlers/wasm_handler";
import { MsgTypes } from "../types/Msg";
import * as ProjectTypes from "../types/Project";
import * as IidTypes from "../types/IID";
import { Tx } from "@ixo/impactxclient-sdk/types/codegen/cosmos/tx/v1beta1/tx";
import { GetTxsEventResponse } from "@ixo/impactxclient-sdk/types/codegen/cosmos/tx/v1beta1/service";
import { decode } from "../util/proto";

export const syncBlock = async (
    transactions: Tx[],
    blockHeight: string,
    timestamp: string,
    txsEvent: GetTxsEventResponse,
) => {
    transactions.forEach(async (tx) => {
        const msg = {
            type: tx.body?.messages[0].typeUrl,
            value: await decode(tx.body?.messages[0]),
        };
        const value = msg.value;
        const type = msg.type;

        switch (type) {
            case MsgTypes.createDid:
                const idocs = IidTypes.convertIID(value);
                await IidHandler.createIid(
                    {
                        id: value.id,
                        versionId: value.versionId,
                        updated: timestamp,
                        created: timestamp,
                        Controller: value.controllers,
                        Context: value.context,
                    },
                    idocs.verificationMethodDocs,
                    idocs.serviceDocs,
                    idocs.accordedRightDocs,
                    idocs.linkedResourceDocs,
                    idocs.linkedEntityDocs,
                );
                break;
            case MsgTypes.updateDid:
                await IidHandler.updateIid(
                    value.id,
                    value.controller,
                    timestamp,
                );
                break;
            case MsgTypes.addVerification:
                await IidHandler.addVerification(
                    {
                        id: value.verification.method.id,
                        iid: value.id,
                        relationships: value.verification.relationships,
                        type: value.verification.method.type,
                        controller: value.verification.method.controller,
                        verificationMaterial:
                            value.verification.method.verificationMaterial,
                    },
                    timestamp,
                );
                break;
            case MsgTypes.setVerificationRelationships:
                await IidHandler.setVerificationRelationships(
                    value.method_id,
                    value.relationships,
                    timestamp,
                );
                break;
            case MsgTypes.revokeVerification:
                await IidHandler.revokeVerification(value.method_id, timestamp);
                break;
            case MsgTypes.addService:
                await IidHandler.addService(
                    {
                        id: value.service_data.id,
                        iid: value.id,
                        type: value.service_data.type,
                        serviceEndpoint: value.service_data.serviceEndpoint,
                    },
                    timestamp,
                );
                break;
            case MsgTypes.deleteService:
                await IidHandler.deleteService(value.service_id, timestamp);
                break;
            case MsgTypes.addAccordedRight:
                await IidHandler.addAccordedRight(
                    {
                        iid: value.id,
                        ...value,
                    },
                    timestamp,
                );
                break;
            case MsgTypes.deleteAccordedRight:
                await IidHandler.deleteAccordedRight(value.right_id, timestamp);
                break;
            case MsgTypes.addLinkedEntity:
                await IidHandler.addLinkedEntity(
                    {
                        iid: value.id,
                        ...value.linkedEntity,
                    },
                    timestamp,
                );
                break;
            case MsgTypes.deleteLinkedEntity:
                await IidHandler.deleteLinkedEntity(value.entity_id, timestamp);
                break;
            case MsgTypes.addLinkedResource:
                await IidHandler.addLinkedResource(
                    {
                        iid: value.id,
                        ...value.linkedResource,
                    },
                    timestamp,
                );
                break;
            case MsgTypes.deleteLinkedResource:
                await IidHandler.deleteLinkedResource(
                    value.resource_id,
                    timestamp,
                );
                break;
            case MsgTypes.addContext:
                await IidHandler.addContext(
                    { id: value.id, context: value.context },
                    timestamp,
                );
                break;
            case MsgTypes.deleteContext:
                await IidHandler.deleteContext(
                    value.id,
                    value.contextKey,
                    timestamp,
                );
                break;
            case MsgTypes.updateMetadata:
                await IidHandler.updateMetadata(value.id, value.meta);
                break;
            case MsgTypes.createProject:
                let projectDoc = value;
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
            case MsgTypes.addDid:
                await DidHandler.createDid({
                    did: value.did,
                    publicKey: value.pubKey,
                });
                break;
            case MsgTypes.buy:
                await BondHandler.createTransaction({
                    bondDid: value.bond_did,
                    buyerDid: value.buyer_did,
                    amount: value.amount.amount,
                    maxPrices: value.max_prices[0].amount,
                });
                break;
            case MsgTypes.setNextAlpha:
                await BondHandler.createAlphaChange({
                    bondDid: value.bond_did,
                    rawValue: msg,
                    height: blockHeight,
                    timestamp: timestamp,
                });
                break;
            case MsgTypes.editAlphaSuccess:
                await BondHandler.createAlphaChange({
                    bondDid: value.bond_did,
                    rawValue: msg,
                    height: blockHeight,
                    timestamp: timestamp,
                });
                break;
            // case MsgTypes.withdrawShare:
            //     const sTx = blockResult.txs_results[0];
            //     sTx.log = JSON.parse(sTx.log);
            //     await BondHandler.createShareWithdrawal({
            //         rawValue: msg,
            //         transaction: sTx,
            //         recipientDid: value.recipient_did,
            //         bondDid: value.bond_did,
            //         height: blockHeight,
            //         timestamp: timestamp,
            //     });
            //     break;
            // case MsgTypes.withdrawReserve:
            //     const rTx = blockResult.txs_results[0];
            //     rTx.log = JSON.parse(rTx.log);
            //     await BondHandler.createReserveWithdrawal({
            //         rawValue: msg,
            //         transaction: rTx,
            //         withdrawerDid: value.withdrawer_did,
            //         bondDid: value.bond_did,
            //         height: blockHeight,
            //         timestamp: timestamp,
            //     });
            //     break;
            case MsgTypes.makeOutcomePayment:
                await BondHandler.createOutcomePayment({
                    rawValue: msg,
                    amount: value.amount,
                    senderDid: value.sender_did,
                    height: blockHeight,
                    timestamp: timestamp,
                    bondDid: value.bond_did,
                });
                break;
            case MsgTypes.createBond:
                await BondHandler.createBond({
                    bondDid: value.bond_did,
                    token: value.token,
                    name: value.name,
                    description: value.description,
                    creatorDid: value.creator_did,
                });
                break;
            case MsgTypes.createAgent:
                await StatHandler.updateAllStats(
                    MsgTypes.createAgent,
                    value.data.role,
                );
                await ProjectHandler.addAgent({
                    agentDid: value.data.did,
                    projectDid: value.projectDid,
                    role: value.data.role,
                    status: "0",
                });
                await ProjectHandler.updateAgentStats(
                    value.projectDid,
                    "0",
                    value.data.role,
                );
                break;
            case MsgTypes.updateAgent:
                if (value.data.status === "1")
                    await StatHandler.updateAllStats(
                        MsgTypes.updateAgent,
                        value.data.role,
                    );
                await ProjectHandler.updateAgentStatus(
                    value.data.did,
                    value.data.status,
                );
                await ProjectHandler.updateAgentStats(
                    value.projectDid,
                    value.data.status,
                    value.data.role,
                );
                break;
            case MsgTypes.createClaim:
                await StatHandler.updateAllStats(MsgTypes.createClaim, "", "0");
                await ProjectHandler.addClaim({
                    claimId: value.data.claimID,
                    claimTemplateId: value.data.claimTemplateID,
                    projectDid: value.projectDid,
                    status: "0",
                });
                break;
            case MsgTypes.evaluateClaim:
                await StatHandler.updateAllStats(
                    MsgTypes.evaluateClaim,
                    "",
                    value.data.status,
                );
                await ProjectHandler.updateClaimStatus(
                    value.data.claimID,
                    value.data.status,
                );
                await ProjectHandler.updateClaimStats(
                    value.projectDid,
                    value.data.status,
                );
                break;
            case MsgTypes.addCredential:
                await DidHandler.addCredential({
                    did: value.credential.cliam.id,
                    claimId: value.credential.claim.id,
                    claimKyc: value.credential.claim.KYCValidated,
                    issuer: value.credential.issuer,
                });
                break;
            case MsgTypes.updateProjectStatus:
                await ProjectHandler.updateProjectStatus(
                    value.projectDid,
                    value.data.status.toUpperCase(),
                );
                break;
            case MsgTypes.updateProjectDoc:
                await ProjectHandler.updateProject(
                    value.projectDid,
                    value.data,
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
