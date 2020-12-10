import {ProjectDB} from '../db/models/project';
import axios from 'axios';
import {io} from '../server';

declare var Promise: any;

export class ProjectHandler {
  listAllProjects = () => {
    return new Promise((resolve: Function, reject: Function) => {
      return ProjectDB.find({}, (err, res) => {
        if (err) {
          reject(err);
        } else {
          io.emit('list all projects', res);
          resolve(res);
        }
      });
    });
  };

  listAllProjectsFiltered = (fields: string[]) => {
    return new Promise((resolve: Function, reject: Function) => {
      const filter = {}
      for (const i in fields) {
        filter[fields[i]] = true
      }
      return ProjectDB.find({}, filter, (err, res) => {
        if (err) {
          reject(err);
        } else {
          io.emit('list specified fields of all projects', res);
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
          io.emit('list projects', res);
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
        ProjectDB.findOne({projectDid: params.projectDid}, (err, res) => {
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
        ProjectDB.findOne({projectDid: projectDid}, (err, res) => {
          if (err) {
            reject(err);
          } else {
            io.emit('list project', res);
            resolve(res);
          }
        });
      });
    }
  };

  listProjectByEntityType = (entityType: string) => {
    if (entityType == undefined) {
      return new Promise((resolve: Function, reject: Function) => {
        reject(new Error("'entityType' not specified in params"));
      });
    } else {
      return new Promise((resolve: Function, reject: Function) => {
        return ProjectDB.find({"data.@type": entityType}, (err, res) => {
          if (err) {
            reject(err);
          } else {
            io.emit('list project by entity type', res);
            resolve(res);
          }
        });
      });
    }
  };

  listProjectBySenderDid = (senderDid: any) => {
    if (senderDid == undefined) {
      return new Promise((resolve: Function, reject: Function) => {
        reject(new Error("'senderDid' not specified in params"));
      });
    } else {
      return new Promise((resolve: Function, reject: Function) => {
        ProjectDB.find({senderDid}, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
    }
  };

  getProjectAccountsFromChain = (projectDid: string) => {
    return new Promise((resolve: Function, reject: Function) => {
      const rest = (process.env.BC_REST || 'http://localhost:1317');
      axios.get(rest + '/projectAccounts/' + projectDid)
        .then((response) => {
          if (response.status == 200) {
            resolve(response.data);
          } else {
            reject(response.statusText);
          }
        })
        .catch((reason) => {
          reject(reason);
        });
    })
  }
}
