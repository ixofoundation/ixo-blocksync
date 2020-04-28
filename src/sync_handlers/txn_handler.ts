import {ProjectSyncHandler} from './project_sync_handler';
import {IAgent, IClaim, IProject} from '../models/project';
import {StatsSyncHandler} from './stats_sync_handler';
import {IStats} from '../models/stats';
import {ICredential, IDid} from '../models/did';
import {DidSyncHandler} from './did_sync_handler';

export class TransactionHandler {
  TXN_TYPE = Object.freeze({
    PROJECT: "project/CreateProject",
    DID: "did/AddDid",
    AGENT_CREATE: "project/CreateAgent",
    AGENT_UPDATE: "project/UpdateAgent",
    CAPTURE_CLAIM: "project/CreateClaim",
    CLAIM_UPDATE: "project/CreateEvaluation",
    PROJECT_STATUS_UPDATE: "project/UpdateProjectStatus",
    ADD_CREDENTIAL: "did/AddCredential"
  });
  AGENT_TYPE = Object.freeze({SERVICE: 'SA', EVALUATOR: 'EA', INVESTOR: 'IA'});
  CLAIM_STATUS = Object.freeze({SUCCESS: '1', REJECTED: '2', PENDING: '0'});
  private projectSyncHandler = new ProjectSyncHandler();
  private statsSyncHandler = new StatsSyncHandler();
  private didSyncHandler = new DidSyncHandler();

  convertHexToAscii(hex: string): string {
    let str = '';
    let i = 0;
    let l = hex.length;

    if (hex.substring(0, 2) === '0x') {
      i = 2;
    }

    for (; i < l; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16);
      str += String.fromCharCode(code);
    }

    return str;
  }

  routeTransactions(txData: string) {
    var result = Promise.resolve();

    result = result.then(() => {
      let buf = Buffer.from(txData, 'base64');
      // console.log('TX DATA: ' + buf.toString());
      return this.routeTransaction(JSON.parse(buf.toString()));
    });

  }

  checkNodeDid = (projectNodeDid: string): boolean => {
    let nodeDidIncluded: boolean = false;
    if (process.env.NODEDID_LIST != undefined) {
      let nodeDids: string[] = (process.env.NODEDID_LIST.split(' '));
      if (nodeDids.length === 0 || nodeDids.some(nodeDid => nodeDid === projectNodeDid)) {
        nodeDidIncluded = true;
      }
    } else {
      return true;
    }
    return nodeDidIncluded;
  };

  routeTransaction(txData: any) {

    if (typeof txData == 'string') {
      // The payload is a string then it is in hex format
      txData = JSON.parse(this.convertHexToAscii(txData))
    }

    // console.log('routeTransaction::: Found ' + JSON.stringify(txData));

    let txIdentifier = txData.payload[0].type;
    let payload = txData.payload[0].value;
    ///// add node did check
    if (txIdentifier == this.TXN_TYPE.PROJECT) {
      let projectDoc: IProject = payload;
      if (this.checkNodeDid(projectDoc.data.nodeDid)) {
        this.updateGlobalStats(this.TXN_TYPE.PROJECT, '', '', projectDoc.data.requiredClaims);
        return this.projectSyncHandler.create(projectDoc);
      }
    } else if (txIdentifier == this.TXN_TYPE.DID) {
      let didDoc: IDid = {
        did: payload.didDoc.did,
        publicKey: payload.didDoc.pubKey
      };
      return this.didSyncHandler.create(didDoc);
    } else if (txIdentifier == this.TXN_TYPE.AGENT_CREATE) {
      let agent: IAgent = {
        did: payload.data.did,
        role: payload.data.role,
        status: '0'
      };
      this.updateGlobalStats(this.TXN_TYPE.AGENT_CREATE, payload.data.role);
      return this.projectSyncHandler.addAgent(payload.projectDid, agent);
    } else if (txIdentifier == this.TXN_TYPE.AGENT_UPDATE) {
      if (payload.data.status === '1') {
        this.updateGlobalStats(this.TXN_TYPE.AGENT_UPDATE, payload.data.role);
      }
      return this.projectSyncHandler.updateAgentStatus(payload.data.did, payload.data.status, payload.projectDid, payload.data.role);
    } else if (txIdentifier == this.TXN_TYPE.CAPTURE_CLAIM) {
      let claim: IClaim = {
        claimId: payload.data.claimID,
        date: new Date(),
        location: {
          long: '33.9249° S',
          lat: '18.4241° E'
        },
        saDid: payload.senderDid,
        status: '0'
      };
      this.updateGlobalStats(this.TXN_TYPE.CAPTURE_CLAIM, '', '0');
      return this.projectSyncHandler.addClaim(payload.projectDid, claim);
    } else if (txIdentifier == this.TXN_TYPE.CLAIM_UPDATE) {
      this.updateGlobalStats(this.TXN_TYPE.CLAIM_UPDATE, '', payload.data.status);
      return this.projectSyncHandler.updateClaimStatus(payload.data.status, payload.projectDid, payload.data.claimID, payload.senderDid);
    } else if (txIdentifier == this.TXN_TYPE.ADD_CREDENTIAL) {
      let credential: ICredential = {
        type: payload.credential.type,
        claim: payload.credential.claim,
        issuer: payload.credential.issuer
      };
      return this.didSyncHandler.addCredential(payload.credential.claim.id, credential);
    } else if (txIdentifier == this.TXN_TYPE.PROJECT_STATUS_UPDATE) {
      return this.projectSyncHandler.updateProjectStatus(payload.data.status, payload.projectDid);
    }
  }

  updateGlobalStats(txnType: string, agentType?: string, claimStatus?: string, claimsRequired?: string) {
    this.statsSyncHandler.getStatsInfo().then((stats: IStats) => {
      let newStats = stats;

      if (claimsRequired) {
        newStats.claims.total = newStats.claims.total + +claimsRequired;
      }

      switch (txnType) {
        case this.TXN_TYPE.PROJECT: {
          newStats.totalProjects++;
          break;
        }
        case this.TXN_TYPE.AGENT_UPDATE: {
          if (agentType === this.AGENT_TYPE.EVALUATOR) {
            newStats.totalEvaluationAgents++;
          } else if (agentType === this.AGENT_TYPE.SERVICE) {
            newStats.totalServiceProviders++;
          } else if (agentType === this.AGENT_TYPE.INVESTOR) {
            newStats.totalInvestors++;
          }
          break;
        }
        case this.TXN_TYPE.CAPTURE_CLAIM: {
          newStats.claims.totalSubmitted++;
          newStats.claims.totalPending++;
          break;
        }
        case this.TXN_TYPE.CLAIM_UPDATE: {
          if (claimStatus === this.CLAIM_STATUS.SUCCESS) {
            newStats.claims.totalPending--;
            newStats.claims.totalSuccessful++;
          } else if (claimStatus === this.CLAIM_STATUS.REJECTED) {
            newStats.claims.totalPending--;
            newStats.claims.totalRejected++;
          }
          break;
        }
      }
      this.statsSyncHandler.update(newStats);
    });
  }
}
