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

    listAllProjects = () => {
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

    listProjectByDid = (params: any) => {
        if (params.projectDid == undefined) {
            return new Promise((resolve: Function, reject: Function) => {
                reject(new Error("'projectDid' not specified in params"));
            })
        } else {
            return new Promise((resolve: Function, reject: Function) => {
                ProjectDB.findOne({ "projectDid": params.projectDid }, (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                });
            })
        }
    }

    updateEvaluationCount = (projectDid: string) => {
        return new Promise((resolve: Function, reject: Function) => {
            return ProjectDB.findOneAndUpdate({ "projectDid": projectDid }, { $inc: { 'data.agents.evaluatorsPending': 1 } }, (err, res) => {
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
            return ProjectDB.findOneAndUpdate({ "projectDid": projectDid }, { $inc: { 'data.agents.serviceProvidersPending': 1 } }, (err, res) => {
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
            return ProjectDB.findOneAndUpdate({ "projectDid": projectDid }, { $inc: { 'data.agents.investors': 1 } }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    updateEvaluationStatus = (projectDid: string, approved: boolean) => {
        return new Promise((resolve: Function, reject: Function) => {
            return ProjectDB.findOneAndUpdate({ "projectDid": projectDid }, approved ? { $inc: { 'data.agents.evaluatorsPending': -1, 'data.agents.evaluators': 1 } } : { $inc: { 'data.agents.evaluatorsPending': -1 } }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    updateServiceAgentStatus = (projectDid: string, approved: boolean) => {
        return new Promise((resolve: Function, reject: Function) => {
            return ProjectDB.findOneAndUpdate({ "projectDid": projectDid }, approved ? { $inc: { 'data.agents.serviceProvidersPending': -1, 'data.agents.serviceProviders': 1 } } : { $inc: { 'data.agents.serviceProvidersPending': -1 } }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }
}