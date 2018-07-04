import { ProjectHandler } from "./project_handler";
import { IProject, IAgent, IClaim } from "../models/project";
import { StatsHandler } from "./stats_handler";
import { IStats } from "../models/stats";
import { IDid } from "../models/did";
import { DidHandler } from "./did_handler";

export class TransactionHandler {
    private projectHandler = new ProjectHandler();
    private statsHandler = new StatsHandler();
    private didHandler = new DidHandler();

    TXN_TYPE = Object.freeze({ "PROJECT": 16, "DID": 10, "AGENT_CREATE": 17, "AGENT_UPDATE": 18, "CAPTURE_CLAIM": 19, "CLAIM_UPDATE": 20 });
    AGENT_TYPE = Object.freeze({ "SERVICE": "SA", "EVALUATOR": "EA", "INVESTOR": "IA" });
    CLAIM_STATUS = Object.freeze({ "SUCCESS": "1", "REJECTED": "2", "PENDING": "0" });

    routeTransaction(txData: any) {
        let txIdentifier = txData.payload[0];
        let payload = txData.payload[1];
        if (txIdentifier == this.TXN_TYPE.PROJECT) {
            let projectDoc: IProject = payload;
            this.projectHandler.create(projectDoc);
            this.updateGlobalStats(this.TXN_TYPE.PROJECT, "", "", projectDoc.data.requiredClaims);
        } else if (txIdentifier == this.TXN_TYPE.DID) {
            let didDoc : IDid = {
                did: payload.didDoc.did,
                publicKey: payload.didDoc.pubKey
            }
            this.didHandler.create(didDoc); 
        } else if (txIdentifier == this.TXN_TYPE.AGENT_CREATE) {
            let agent: IAgent = {
                did: payload.data.did,
                role: payload.data.role,
                status: "0"
            };
            this.projectHandler.addAgent(payload.projectDid, agent);
            this.updateGlobalStats(this.TXN_TYPE.AGENT_CREATE, payload.data.role);
        } else if (txIdentifier == this.TXN_TYPE.AGENT_UPDATE) {
            this.projectHandler.updateAgentStatus(payload.data.did, payload.data.status, payload.projectDid, payload.data.role);
            if (payload.data.status === "1") {
                this.updateGlobalStats(this.TXN_TYPE.AGENT_UPDATE, payload.data.role);
            }
        } else if (txIdentifier == this.TXN_TYPE.CAPTURE_CLAIM) {
            let claim: IClaim = {
                claimId: payload.data.claimID,
                date: new Date(),
                location: {
                    long: "33.9249° S",
                    lat: "18.4241° E"
                },
                saDid: payload.senderDid,
                status: "0"
            };
            this.projectHandler.addClaim(payload.projectDid, claim);
            this.updateGlobalStats(this.TXN_TYPE.CAPTURE_CLAIM, "", "0");
        } else if (txIdentifier == this.TXN_TYPE.CLAIM_UPDATE) {
            this.projectHandler.updateClaimStatus(payload.data.status, payload.projectDid, payload.data.claimID, payload.senderDid);
            this.updateGlobalStats(this.TXN_TYPE.CLAIM_UPDATE, "", payload.data.status);
        }
    }

    updateGlobalStats(txnType: number, agentType?: string, claimStatus?: string, claimsRequired?: number) {
        this.statsHandler.getStatsInfo().then((stats: IStats) => {
            let newStats = stats;

            if (claimsRequired) {
                newStats.claims.total = newStats.claims.total + claimsRequired;
            }

            switch (txnType) {
                case this.TXN_TYPE.PROJECT: {
                    newStats.totalProjects++;
                    break;
                }
                case this.TXN_TYPE.AGENT_UPDATE: {
                    if (agentType === this.AGENT_TYPE.EVALUATOR) {
                        newStats.totalEvaluationAgents++;
                    } else if (agentType === this.AGENT_TYPE.SERVICE) {
                        newStats.totalServiceProviders++;
                    } else if (agentType === this.AGENT_TYPE.INVESTOR) {
                        newStats.totalInvestors++;
                    }
                    break;
                }
                case this.TXN_TYPE.CAPTURE_CLAIM: {
                    newStats.claims.totalSubmitted++;
                    newStats.claims.totalPending++;
                    break;
                }
                case this.TXN_TYPE.CLAIM_UPDATE: {
                    if (claimStatus === this.CLAIM_STATUS.SUCCESS) {
                        newStats.claims.totalPending--;
                        newStats.claims.totalSuccessful++;
                    } else if (claimStatus === this.CLAIM_STATUS.REJECTED) {
                        newStats.claims.totalPending--;
                        newStats.claims.totalRejected++;
                    }
                    break;
                }
            }
            this.statsHandler.update(newStats);
        });
    }
}