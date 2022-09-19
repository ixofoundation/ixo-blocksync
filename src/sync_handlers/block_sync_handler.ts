import * as Connection from "../util/connection";
import * as ProjectHandler from "../handlers/project_handler";
import * as StatHandler from "../handlers/stats_handler";
import * as DidHandler from "../handlers/did_handler";
import * as BondHandler from "../handlers/bond_handler";
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
                    amount: value.amount,
                    maxPrices: value.maxPrices,
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
                    projectDid: value.projectDid,
                    date: new Date(),
                    location: ["33.9249° S", "18.4241° E"],
                    saId: value.senderDid,
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
                    value.data.claimId,
                    value.data.status,
                    value.senderDid,
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
                    value.data,
                );
                break;
            case MsgTypes.updateProjectDoc:
                await ProjectHandler.updateProject(
                    value.projectDid,
                    value.data,
                );
                break;
            // case MsgTypes.WasmMsgTypes.storeCode
        }
    });
};
