import { ProjectDB } from '../db/models/project';
import { IProject } from '../models/project';

declare var Promise: any;

export class ProjectHandler {

    create = (project: IProject) => {
        return new Promise((resolve: Function, reject: Function) => {
            return ProjectDB.create(project, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    listAllProjects = (numberOfProjects: number) => {
        return new Promise((resolve: Function, reject: Function) => {
            return ProjectDB.find({}, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    listProjectByDid = (projectDid: string) => {
        if (projectDid == undefined) {
            return new Promise((resolve: Function, reject: Function) => {
                reject(new Error("'projectDid' not specified in params"));
            })
        } else {
            return ProjectDB.find({ "projectDid": projectDid })
                .exec();
        }
    }

    updateEvaluationCount = (projectDid: string) => {
        return new Promise((resolve: Function, reject: Function) => {
            return ProjectDB.findOneAndUpdate({ "projectDid": projectDid }, { $inc: { 'agents.evaluatorsPending': 1 } }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    updateServiceAgentCount = (projectDid: string) => {
        return new Promise((resolve: Function, reject: Function) => {
            return ProjectDB.findOneAndUpdate({ "projectDid": projectDid }, { $inc: { 'agents.serviceProvidersPending': 1 } }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    updateInvestmentAgentCount = (projectDid: string) => {
        return new Promise((resolve: Function, reject: Function) => {
            return ProjectDB.findOneAndUpdate({ "projectDid": projectDid }, { $inc: { 'agents.investorsPending': 1 } }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

}