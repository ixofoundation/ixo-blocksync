import { ProjectHandler } from "./project_handler";
import { IProject } from "../models/project";
import { StatsHandler } from "./stats_handler";
import { IStats } from "../models/stats";

export class TransactionHandler {
    private projectHandler = new ProjectHandler();
    private statsHandler = new StatsHandler();

    routeTransaction(txData: any) {
        let txIdentifier = txData.payload[0];
        let payload = txData.payload[1];
        if (txIdentifier == 16) {
            let projectDoc: IProject = payload;
            this.projectHandler.create(projectDoc);
            this.statsHandler.getStatsInfo().then((stats: IStats) => {
                let newStats = stats;
                newStats.totalProjects++;
                this.statsHandler.update(newStats);
            })
        } else if (txIdentifier == 10) {
            console.log("Skipping DID Doc...");
        } else if (txIdentifier == 17) {
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
        } else if (txIdentifier == 18) {
            let projectDid = payload.projectDid;
            let agentRole = payload.data.role;
            switch (agentRole) {
                case "EA": {
                    this.projectHandler.updateEvaluationStatus(projectDid);
                    break;
                };
                case "SA": {
                    this.projectHandler.updateServiceAgentStatus(projectDid);
                    break;
                }
            }
        }
    }
}