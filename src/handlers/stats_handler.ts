import { StatsDB } from "../db/models/stats";

export class StatsHandler {
    getStatsInfo = () => {
        return new Promise((resolve: Function, reject: Function) => {
            return StatsDB.find({}, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res[0]);
                }
            });
        });
    }
}