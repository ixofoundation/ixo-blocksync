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

    list = () => {
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
}