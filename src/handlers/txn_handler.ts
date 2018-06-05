import { ProjectHandler } from "./project_handler";
import { IProject } from "../models/project";
import { StatsHandler } from "./stats_handler";
import { IStats } from "../models/stats";

export class TransactionHandler {
    private projectHandler = new ProjectHandler();
    private statsHandler = new StatsHandler();

    routeTransaction(txData: any) {
        let payload = txData.payload[1];
        if (payload.hasOwnProperty('projectDid')) {
            let projectDoc: IProject = payload;
            this.projectHandler.create(projectDoc);
            this.statsHandler.getStatsInfo().then((stats: IStats) => {
                let newStats = stats;
                newStats.totalProjects++;
                this.statsHandler.update(newStats);
            })
        } else if (payload.hasOwnProperty('didDoc')) {
            console.log("Skipping DID Doc...");
        }
    }
}