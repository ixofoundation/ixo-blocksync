import * as Connection from "../util/connection";
import * as ProjectHandler from "../handlers/project_handler";
import * as StatHandler from "../handlers/stats_handler";
import * as DidHandler from "../handlers/did_handler";
import * as BondHandler from "../handlers/bond_handler";
import * as WasmHandler from "../handlers/wasm_handler";
import { MsgTypes } from "../types/Msg";
import * as ProjectTypes from "../types/Project";

export const syncBlock = async (
    transactions: any,
    blockHeight: string,
    timestamp: string,
    blockResult: any,
) => {
    transactions.forEach(async (tx: any) => {
        const transaction = await Connection.decodeTx(tx);
        const msg = transaction.msg[0];
        const value = msg.value;
        const type = msg.type;

        switch (type) {
            case MsgTypes.createProject:
                let projectDoc = value;
                StatHandler.updateAllStats(
                    MsgTypes.createProject,
                    "",
                    "",
                    projectDoc.data.requiredClaims,
                );
                let docs = ProjectTypes.convertProject(projectDoc);
                await ProjectHandler.createProject(
                    docs.projectDoc,
                    docs.agentDocs,
                    docs.claimDocs,
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
            case MsgTypes.withdrawShare:
                await BondHandler.createShareWithdrawal({
                    rawValue: msg,
                    transaction: blockResult.txs_results[0],
                    recipientDid: value.recipient_did,
                    bondDid: value.bond_did,
                    height: blockHeight,
                    timestamp: timestamp,
                });
                break;
            case MsgTypes.withdrawReserve:
                await BondHandler.createReserveWithdrawal({
                    rawValue: msg,
                    transaction: blockResult.txs_results[0],
                    withdrawerDid: value.withdrawer_did,
                    bondDid: value.bond_did,
                    height: blockHeight,
                    timestamp: timestamp,
                });
                break;
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
                    value.data.status,
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
