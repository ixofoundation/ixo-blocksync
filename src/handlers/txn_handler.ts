import { ProjectHandler } from "./project_handler";
import { IProject } from "../models/project";
import { StatsHandler } from "./stats_handler";
import { IStats } from "../models/stats";

export class TransactionHandler {
    private projectHandler = new ProjectHandler();
    private statsHandler = new StatsHandler();

    TXN_TYPE = Object.freeze({ "PROJECT": 16, "DID": 10, "AGENT_CREATE": 17, "AGENT_UPDATE": 18 });

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
            })
        } else if (txIdentifier == this.TXN_TYPE.DID) {
            console.log("Skipping DID Doc...");
        } else if (txIdentifier == this.TXN_TYPE.AGENT_CREATE) {
            let projectDid = payload.projectDid;
            let agentRole = payload.data.role;
            switch (agentRole) {
                case "EA": {
                    this.projectHandler.updateEvaluationCount(projectDid);
                    break;
                };
                case "IA": {
                    this.projectHandler.updateInvestmentAgentCount(projectDid);
                    break;
                }
                case "SA": {
                    this.projectHandler.updateServiceAgentCount(projectDid);
                    break;
                }
            }
        } else if (txIdentifier == this.TXN_TYPE.AGENT_UPDATE) {
            let projectDid = payload.projectDid;
            let agentRole = payload.data.role;
            let approved: boolean;

            if (payload.data.status === "1") {
                approved = true;
            } else {
                approved = false;
            }

            switch (agentRole) {
                case "EA": {
                    this.projectHandler.updateEvaluationStatus(projectDid, approved);
                    break;
                };
                case "SA": {
                    this.projectHandler.updateServiceAgentStatus(projectDid, approved);
                    break;
                }
            }
        }
    }
}