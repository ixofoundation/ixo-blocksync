import { ProjectHandler } from "./project_handler";
import { IProject, IAgent, IClaim } from "../models/project";
import { StatsHandler } from "./stats_handler";
import { IStats } from "../models/stats";

export class TransactionHandler {
    private projectHandler = new ProjectHandler();
    private statsHandler = new StatsHandler();

    TXN_TYPE = Object.freeze({ "PROJECT": 16, "DID": 10, "AGENT_CREATE": 17, "AGENT_UPDATE": 18, "CAPTURE_CLAIM": 19, "CLAIM_UPDATE": 20 });

    routeTransaction(txData: any) {
        let txIdentifier = txData.payload[0];
        let payload = txData.payload[1];
        if (txIdentifier == this.TXN_TYPE.PROJECT) {
            let projectDoc: IProject = payload;
            this.projectHandler.create(projectDoc);
            this.statsHandler.getStatsInfo().then((stats: IStats) => {
                let newStats = stats;
                newStats.totalProjects++;
                this.statsHandler.update(newStats);
            });
        } else if (txIdentifier == this.TXN_TYPE.DID) {
            console.log("Skipping DID Doc...");
        } else if (txIdentifier == this.TXN_TYPE.AGENT_CREATE) {
            let agent: IAgent = {
                did: payload.data.did,
                role: payload.data.role,
                status: "0"
            };
            this.projectHandler.addAgent(payload.projectDid, agent);
        } else if (txIdentifier == this.TXN_TYPE.AGENT_UPDATE) {
            this.projectHandler.updateAgentStatus(payload.data.did, payload.data.status, payload.projectDid, payload.data.role);
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
        } else if (txIdentifier == this.TXN_TYPE.CLAIM_UPDATE) {
            this.projectHandler.updateClaimStatus(payload.data.status, payload.projectDid, payload.data.claimID, payload.senderDid);
        }
    }
}