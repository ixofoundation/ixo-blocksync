import * as ProjectHandler from "../handlers/project_handler";
import * as StatHandler from "../handlers/stats_handler";
import * as DidHandler from "../handlers/did_handler";
import * as BondHandler from "../handlers/bonds_handler";
import * as BondSyncHandler from "../sync_handlers/bonds_sync_handler";
import { convertProjectDoc, IAgent, IClaim, NewProject } from "../interface_models/Project";
import { IStat } from "../interface_models/Stat";
import { ICredential, IDid } from "../interface_models/DID";
import { ITransaction } from "../interface_models/Transaction";
import { IAlphaChange } from "../interface_models/AlphaChange";
import { IShareWithdrawal } from "../interface_models/ShareWithdrawal";
import { IReserveWithdrawal } from "../interface_models/ReserveWithdrawal";
import { IOutcomePayment } from "../interface_models/OutcomePayment";
import { IBond } from "../interface_models/Bond";

export class TransactionHandler {
    TXN_TYPE = Object.freeze({
        PROJECT: "project/CreateProject",
        DID: "did/AddDid",
        BOND_CREATE: "bonds/MsgCreateBond",
        BOND_TRANSACTION_FULFILL: "bonds/MsgBuy",
        BOND_TRANSACTION_OUTCOMEPAYMENT: "bonds/MsgMakeOutcomePayment",
        BOND_WITHDRAWEL: "bonds/MsgWithdrawShare",
        BOND_ALPHA_CHANGE: "bonds/MsgSetNextAlpha",
        BOND_ALPHA_CHANGE_EDIT_SUCCESS: "bonds/EditAlphaSuccess",
        BOND_WITHDRAWEL_RESERVE: "bonds/MsgWithdrawReserve",
        BOND_PRICE_CHANGE: "bonds/price_change",
        AGENT_CREATE: "project/CreateAgent",
        AGENT_UPDATE: "project/UpdateAgent",
        CAPTURE_CLAIM: "project/CreateClaim",
        CLAIM_UPDATE: "project/CreateEvaluation",
        PROJECT_STATUS_UPDATE: "project/UpdateProjectStatus",
        PROJECT_DOC_UPDATE: "project/UpdateProjectDoc",
        ADD_CREDENTIAL: "did/AddCredential"
    });
    AGENT_TYPE = Object.freeze({ SERVICE: 'SA', EVALUATOR: 'EA', INVESTOR: 'IA' });
    CLAIM_STATUS = Object.freeze({ SUCCESS: '1', REJECTED: '2', PENDING: '0' });

    convertHexToAscii(hex: string): string {
        console.log(hex);
        let str = "";
        let i = 0;
        let l = hex.length;
        if (hex.substring(0, 2) === "0x") {
            i = 2;
        };
        for (; i < l; i += 2) {
            const code = parseInt(hex.substring(i, 2), 16);
            str += String.fromCharCode(code);
        };
        return str;
    };

    checkNodeDid = (projectNodeDid: string): boolean => {
        let nodeDidIncluded: boolean = false;
        if (process.env.NODEDID_LIST != undefined) {
            let nodeDids: string[] = (process.env.NODEDID_LIST.split(" "));
            if (nodeDids.length === 0 || nodeDids.some(nodeDid => nodeDid === projectNodeDid)) {
                nodeDidIncluded = true;
            }
        } else {
            return true;
        }
        return nodeDidIncluded;
    };

    updateGlobalStats = async (txnType: string, agentType?: string, claimStatus?: string, claimsRequired?: string) => {
        let statDocs = await StatHandler.getStats();
        let statDoc = statDocs[0];
        let currentStats: IStat = {
            totalServiceProviders: statDoc.totalServiceProviders,
            totalProjects: statDoc.totalProjects,
            totalEvaluationAgents: statDoc.totalEvaluationAgents,
            totalInvestors: statDoc.totalInvestors,
            totalClaims: statDoc.totalClaims,
            successfulClaims: statDoc.successfulClaims,
            submittedClaims: statDoc.submittedClaims,
            pendingClaims: statDoc.pendingClaims,
            rejectedClaims: statDoc.rejectedClaims,
            claimLocations: statDoc.claimLocations,
        };

        if (claimsRequired) {
            currentStats.totalClaims = currentStats.totalClaims + Number(claimsRequired);
        };

        switch (txnType) {
            case this.TXN_TYPE.PROJECT: {
                currentStats.totalProjects++;
                break;
            };
            case this.TXN_TYPE.AGENT_UPDATE: {
                if (agentType === this.AGENT_TYPE.EVALUATOR) {
                    currentStats.totalEvaluationAgents++;
                } else if (agentType === this.AGENT_TYPE.SERVICE) {
                    currentStats.totalServiceProviders++;
                } else if (agentType === this.AGENT_TYPE.INVESTOR) {
                    currentStats.totalInvestors++;
                };
                break;
            };
            case this.TXN_TYPE.CAPTURE_CLAIM: {
                currentStats.submittedClaims++;
                currentStats.pendingClaims++;
                break;
            };
            case this.TXN_TYPE.CLAIM_UPDATE: {
                if (claimStatus === this.CLAIM_STATUS.SUCCESS) {
                    currentStats.pendingClaims--;
                    currentStats.successfulClaims++;
                } else if (claimStatus === this.CLAIM_STATUS.REJECTED) {
                    currentStats.pendingClaims--;
                    currentStats.rejectedClaims++;
                };
                break;
            };
        };
        await StatHandler.updateStats(currentStats);
    };

    routeTransaction = async (txData: any, height: string, timestamp: string, rawblock: any) => {
        console.log(txData);
        const txdataraw = txData;

        if (typeof txData == "string") {
            txData = JSON.parse(this.convertHexToAscii(txData))
        }

        console.log("routeTransaction::: Found " + JSON.stringify(txData));

        const msgVal = txData.msg[0].value;
        const msgComplete = txData.msg[0];
        const msgCompleteTransaction = txData;

        console.log(msgVal);
        console.log(msgCompleteTransaction);

        switch (txData.msg[0].type) {
            case this.TXN_TYPE.PROJECT:
                let projectDoc: NewProject = msgVal;
                if (this.checkNodeDid(projectDoc.data.nodeDid)) {
                    this.updateGlobalStats(this.TXN_TYPE.PROJECT, "", "", projectDoc.data.requiredClaims);
                    let docs = convertProjectDoc(projectDoc);
                    return ProjectHandler.createProject(docs.projectDoc, docs.agentDocs, docs.claimDocs);
                };
                break;
            case this.TXN_TYPE.DID:
                let didDoc: IDid = {
                    did: msgVal.did,
                    publicKey: msgVal.pubKey,
                };
                return DidHandler.createDid(didDoc);
            case this.TXN_TYPE.BOND_TRANSACTION_FULFILL:
                console.log(msgVal);
                let transactionDoc: ITransaction = {
                    bondDid: JSON.stringify(msgVal.bond_did),
                    buyerDid: JSON.stringify(msgVal.buyer_did),
                    amount: JSON.stringify(msgVal.amount),
                    maxPrices: JSON.stringify(msgVal.max_prices),
                };
                return BondHandler.createTransaction(transactionDoc);
            case this.TXN_TYPE.BOND_ALPHA_CHANGE:
                console.log(msgVal);
                console.log("Setting Alpha Event");
                let alphaChangeDoc: IAlphaChange = {
                    bondDid: msgVal.bond_did,
                    rawValue: JSON.stringify(msgComplete),
                    height: height,
                    timestamp: timestamp,
                };
                return BondHandler.createAlphaChange(alphaChangeDoc);
            case this.TXN_TYPE.BOND_ALPHA_CHANGE_EDIT_SUCCESS:
                console.log(msgVal);
                console.log(msgCompleteTransaction);
                console.log("Setting Alpha Event");
                let updateAlphaChangeDoc: IAlphaChange = {
                    bondDid: msgVal.bond_did,
                    rawValue: JSON.stringify(msgComplete),
                    height: height,
                    timestamp: timestamp,
                };
                return BondHandler.createAlphaChange(updateAlphaChangeDoc);
            case this.TXN_TYPE.BOND_WITHDRAWEL:
                console.log(msgCompleteTransaction.msg[0].value);
                console.log("Bond share withdraw event");
                let bondwithdrawDoc: IShareWithdrawal = {
                    rawValue: JSON.stringify(msgComplete),
                    transaction: JSON.stringify(rawblock.blockResult.txs_results[0]),
                    recipientDid: msgVal.recipient_did,
                    bondDid: msgVal.bond_did,
                    height: height,
                    timestamp: timestamp,
                };
                return BondHandler.createShareWithdrawal(bondwithdrawDoc);
            case this.TXN_TYPE.BOND_WITHDRAWEL_RESERVE:
                console.log(msgCompleteTransaction);
                console.log("Bond reserve withdraw event");
                let bondwithdrawreserveDoc: IReserveWithdrawal = {
                    rawValue: JSON.stringify(msgComplete),
                    transaction: JSON.stringify(rawblock.blockResult.txs_results[0]),
                    withdrawerDid: msgVal.withdrawer_did,
                    bondDid: msgVal.bond_did,
                    height: height,
                    timestamp: timestamp,
                };
                return BondHandler.createReserveWithdrawal(bondwithdrawreserveDoc);
            case this.TXN_TYPE.BOND_TRANSACTION_OUTCOMEPAYMENT:
                console.log(msgCompleteTransaction);
                console.log("Bond outcome payments event");
                let outcomepaymentDoc: IOutcomePayment = {
                    rawValue: JSON.stringify(msgCompleteTransaction),
                    amount: JSON.stringify(msgVal.amount),
                    senderDid: JSON.stringify(msgVal.sender_did),
                    height: height,
                    timestamp: timestamp,
                    bondDid: JSON.stringify(msgVal.bond_did),
                };
                return BondHandler.createOutcomePayment(outcomepaymentDoc);
            case this.TXN_TYPE.BOND_CREATE:
                let bondDoc: IBond = {
                    bondDid: msgVal.bond_did,
                    token: msgVal.token,
                    name: msgVal.name,
                    description: msgVal.description,
                    creatorDid: msgVal.creator_did,
                };
                return BondHandler.createBond(bondDoc);
            case this.TXN_TYPE.AGENT_CREATE:
                let agentDoc: IAgent = {
                    agentDid: msgVal.data.did,
                    projectDid: msgVal.projectDid,
                    role: msgVal.data.role,
                    status: "0"
                };
                this.updateGlobalStats(this.TXN_TYPE.AGENT_CREATE, msgVal.data.role);
                return ProjectHandler.addAgent(agentDoc);
            case this.TXN_TYPE.AGENT_UPDATE:
                if (msgVal.data.status === "1") {
                    this.updateGlobalStats(this.TXN_TYPE.AGENT_UPDATE, msgVal.data.role);
                };
                return ProjectHandler.updateAgentStatus(msgVal.data.did, msgVal.data.status);
            case this.TXN_TYPE.CAPTURE_CLAIM:
                let claimDoc: IClaim = {
                    claimId: msgVal.data.claimID,
                    projectDid: msgVal.projectDid,
                    claimTemplateId: msgVal.data.claimTemplateID,
                    date: new Date(),
                    location: ["33.9249° S", "18.4241° E"],
                    saId: msgVal.senderDid,
                    status: "0",
                };
                this.updateGlobalStats(this.TXN_TYPE.CAPTURE_CLAIM, "", "0");
                return ProjectHandler.addClaim(claimDoc);
            case this.TXN_TYPE.CLAIM_UPDATE:
                this.updateGlobalStats(this.TXN_TYPE.CLAIM_UPDATE, "", msgVal.data.status);
                return ProjectHandler.updateClaimStatus(msgVal.data.claimID, msgVal.data.status, msgVal.senderDid);
            case this.TXN_TYPE.ADD_CREDENTIAL:
                let credentialDoc: ICredential = {
                    did: msgVal.credential.cliam.id,
                    claimId: msgVal.credential.claim.id,
                    claimKyc: msgVal.credential.claim.KYCValidated,
                    issuer: msgVal.credential.issuer
                };
                return DidHandler.addCredential(credentialDoc);
            case this.TXN_TYPE.PROJECT_STATUS_UPDATE:
                return ProjectHandler.updateProjectStatus(msgVal.projectDid, msgVal.data.status);
            case this.TXN_TYPE.PROJECT_DOC_UPDATE:
                return ProjectHandler.updateProject(msgVal.projectDid, convertProjectDoc(msgVal.data).projectDoc);
        };
    };
};