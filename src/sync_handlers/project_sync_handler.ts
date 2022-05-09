import { ProjectDB } from '../db/models/project';
import { IAgent, IClaim, IProject } from '../models/project';
import { io } from '../server';

declare var Promise: any;

export class ProjectSyncHandler {
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
  };

  addAgent = (projectDid: string, agent: IAgent) => {
    return new Promise((resolve: Function, reject: Function) => {
      return ProjectDB.findOneAndUpdate({ projectDid: projectDid }, { $push: { 'data.agents': agent } }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          io.emit('agent added', { projectDid: projectDid, agent: agent });
          resolve(res);
        }
      });
    });
  };

  updateAgentStatus = (agentDid: string, status: string, projectDid: string, role: string) => {
    return new Promise((resolve: Function, reject: Function) => {
      return ProjectDB.findOneAndUpdate(
        { projectDid: projectDid, 'data.agents.did': agentDid },
        { $set: { 'data.agents.$.status': status } },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            if (status === '1') {
              this.updateAgentStats(role, '0', projectDid);
              this.updateAgentStats(role, status, projectDid);
            } else if (status === '2') {
              this.updateAgentStats(role, '0', projectDid);
              this.updateAgentStats(role, '1', projectDid);
            } else {
              this.updateAgentStats(role, status, projectDid);
            }
            io.emit('agent updated', { agentDid: agentDid, status: status });
            resolve(res);
          }
        }
      );
    });
  };

  getAgentCount = (status: string, projectDid: string, role: string): Promise<number> => {
    return new Promise((resolve: Function, reject: Function) => {
      return ProjectDB.aggregate(
        [
          { $match: { projectDid: projectDid } },
          { $unwind: '$data.agents' },
          {
            $group: {
              _id: 0,
              count: {
                $sum: {
                  $cond: [
                    {
                      $and: [{ $eq: ['$data.agents.role', role] }, { $eq: ['$data.agents.status', status] }]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ],
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            try {
              resolve(res[0].count);
            } catch (error) {
              resolve(error);
            }
          }
        }
      );
    });
  };

  updateAgentStats = (role: string, status: string, projectDid: string) => {
    this.getAgentCount(status, projectDid, role).then((count: number) => {
      let statsProp;
      if (status === '0' && role === 'SA') {
        statsProp = { 'data.agentStats.serviceProvidersPending': count };
      } else if (status === '1' && role === 'SA') {
        statsProp = { 'data.agentStats.serviceProviders': count };
      } else if (status === '0' && role === 'EA') {
        statsProp = { 'data.agentStats.evaluatorsPending': count };
      } else if (status === '1' && role === 'EA') {
        statsProp = { 'data.agentStats.evaluators': count };
      } else if (status === '0' && role === 'IA') {
        statsProp = { 'data.agentStats.investorsPending': count };
      } else if (status === '1' && role === 'IA') {
        statsProp = { 'data.agentStats.investors': count };
      }

      return new Promise((resolve: Function, reject: Function) => {
        return ProjectDB.findOneAndUpdate({ projectDid: projectDid }, statsProp, (err, res) => {
          if (err) {
            reject(err);
          } else {
            io.emit('agent stats updated', { projectDid: projectDid, updatedStats: statsProp });
            resolve(res);
          }
        });
      });
    });
  };

  addClaim = (projectDid: string, claim: IClaim) => {
    return new Promise((resolve: Function, reject: Function) => {
      return ProjectDB.findOneAndUpdate({ projectDid: projectDid }, { $push: { 'data.claims': claim } }, (err, res) => {
        if (err) {
          reject(err);
        } else {
          this.updateClaimStats(claim.status, projectDid);
          io.emit('claim added', { projectDid: projectDid, claim: claim });
          resolve(res);
        }
      });
    });
  };

  updateClaimStatus = (status: string, projectDid: string, claimId: string, agentDid: string) => {
    return new Promise((resolve: Function, reject: Function) => {
      return ProjectDB.findOneAndUpdate(
        { projectDid: projectDid, 'data.claims.claimId': claimId },
        { $set: { 'data.claims.$.status': status, 'data.claims.$.eaDid': agentDid } },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            this.updateClaimStats(status, projectDid);
            io.emit('claim updated', { projectDid: projectDid, status: status });
            resolve(res);
          }
        }
      );
    });
  };

  updateClaimStats = (status: string, projectDid: string) => {
    this.getClaimCount(status, projectDid).then((count: number) => {
      let statsProp;
      if (status === '1') {
        statsProp = { 'data.claimStats.currentSuccessful': count };
      } else if (status === '2') {
        statsProp = { 'data.claimStats.currentRejected': count };
      }

      return new Promise((resolve: Function, reject: Function) => {
        return ProjectDB.findOneAndUpdate({ projectDid: projectDid }, statsProp, (err, res) => {
          if (err) {
            reject(err);
          } else {
            io.emit('claim stats updated', { projectDid: projectDid, updatedStats: statsProp });
            resolve(res);
          }
        });
      });
    });
  };

  getClaimCount = (status: string, projectDid: string): Promise<number> => {
    return new Promise((resolve: Function, reject: Function) => {
      return ProjectDB.aggregate(
        [
          { $match: { projectDid: projectDid } },
          { $unwind: '$data.claims' },
          {
            $group: {
              _id: 0,
              count: {
                $sum: {
                  $cond: [{ $eq: ['$data.claims.status', status] }, 1, 0]
                }
              }
            }
          }
        ],
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            try {
              resolve(res[0].count);
            } catch (error) {
              resolve(error);
            }
          }
        }
      );
    });
  };

  updateProjectStatus = (status: string, projectDid: string) => {
    return new Promise((resolve: Function, reject: Function) => {
      return ProjectDB.findOneAndUpdate(
        { projectDid: projectDid },
        { $set: { 'status': status } },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            io.emit('project status updated', { projectDid: projectDid, status: status });
            resolve(res);
          }
        }
      );
    });
  };

  updateProjectDoc = (doc: any, projectDid: string) => {
    return new Promise((resolve: Function, reject: Function) => {
      return ProjectDB.findOne({ projectDid: projectDid })
        .then((prevProject) => {
          if (prevProject) {
            // Order of fields matters:
            // - fields before `doc` will be overwritten by their values in `doc` (if they are specified in `doc`)
            // - fields after `doc` will take on their previous values (from `prevProject`), whether they were specified in `doc` or not
            const newData = {
              createdOn: prevProject.data.createdOn,
              createdBy: prevProject.data.createdBy,
              nodeDid: prevProject.data.nodeDid,
              ...doc,
              claimStats: prevProject.data.claimStats,
              agentStats: prevProject.data.agentStats,
              ixo: prevProject.data.ixo,
              agents: prevProject.data.agents,
            }

            ProjectDB.updateOne(
              { projectDid: projectDid },
              { $set: { 'data': newData } },
              (err, res) => {
                if (err) {
                  reject(err);
                } else {
                  io.emit('project doc updated', { projectDid: projectDid });
                  resolve(res);
                }
              }
            )
          }
        })
        .catch((err) => {
          io.emit('error while updating project doc: project not found', { err })
          reject(err);
        });
    });
  };
}
