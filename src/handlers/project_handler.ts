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

    listProjectByDid = (params: any) => {
        if (params.projectDid == undefined) {
            return new Promise((resolve: Function, reject: Function) => {
                reject(new Error("'projectDid' not specified in params"));
            })
        } else {
            return ProjectDB.find({ "projectDid": params.projectDid })
                .exec();
        }
    }

    listProjectStats = () => {

    }

}