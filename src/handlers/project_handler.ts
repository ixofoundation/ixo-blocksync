import { ProjectDB } from '../db/models/project';

declare var Promise: any;

export class ProjectHandler {
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
	};

	listProjects = (filter: any) => {
		return new Promise((resolve: Function, reject: Function) => {
			return ProjectDB.find(filter, (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(res);
				}
			});
		});
	};

	listAgentByDid = (params: any) => {
		if (params.projectDid == undefined || params.agentDid == undefined) {
			return new Promise((resolve: Function, reject: Function) => {
				reject(new Error("'projectDid' or 'agentDid' not specified in params"));
			});
		} else {
			return new Promise((resolve: Function, reject: Function) => {
				ProjectDB.findOne({ projectDid: params.projectDid }, (err, res) => {
					if (err) {
						reject(err);
					} else {
						resolve(res);
					}
				});
			});
		}
	};

	listProjectByProjectDid = (projectDid: string) => {
		if (projectDid == undefined) {
			return new Promise((resolve: Function, reject: Function) => {
				reject(new Error("'projectDid' not specified in params"));
			});
		} else {
			return new Promise((resolve: Function, reject: Function) => {
				ProjectDB.findOne({ projectDid: projectDid }, (err, res) => {
					if (err) {
						reject(err);
					} else {
						resolve(res);
					}
				});
			});
		}
	};

	listProjectBySenderDid = (params: any) => {
		if (params.senderDid == undefined) {
			return new Promise((resolve: Function, reject: Function) => {
				reject(new Error("'senderDid' not specified in params"));
			});
		} else {
			return new Promise((resolve: Function, reject: Function) => {
				ProjectDB.find({ senderDid: params.senderDid }, (err, res) => {
					if (err) {
						reject(err);
					} else {
						resolve(res);
					}
				});
			});
		}
	};

}
