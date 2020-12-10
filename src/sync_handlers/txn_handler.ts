import {ProjectSyncHandler} from './project_sync_handler';
import {IAgent, IClaim, IProject} from '../models/project';
import {StatsSyncHandler} from './stats_sync_handler';
import {IStats} from '../models/stats';
import {ICredential, IDid} from '../models/did';
import {DidSyncHandler} from './did_sync_handler';
import {BondSyncHandler} from './bonds_sync_handler';
import {IBond} from "../models/bonds";

export class TransactionHandler {
  TXN_TYPE = Object.freeze({
    PROJECT: "project/CreateProject",
    DID: "did/AddDid",
    BOND_CREATE: "bonds/MsgCreateBond",
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
  private bondSyncHandler = new BondSyncHandler();

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
      // If the tx is a string then assume it is in hex format
      txData = JSON.parse(this.convertHexToAscii(txData))
    }

    // console.log('routeTransaction::: Found ' + JSON.stringify(txData));

    const msgVal = txData.msg[0].value;
    switch (txData.msg[0].type) {
      case this.TXN_TYPE.PROJECT:
        let projectDoc: IProject = msgVal;
        if (this.checkNodeDid(projectDoc.data.nodeDid)) {
          this.updateGlobalStats(this.TXN_TYPE.PROJECT, '', '', projectDoc.data.requiredClaims);
          return this.projectSyncHandler.create(projectDoc);
        }
        break;
      case this.TXN_TYPE.DID:
        let didDoc: IDid = {
          did: msgVal.did,
          publicKey: msgVal.pubKey
        };
        return this.didSyncHandler.create(didDoc);
      case this.TXN_TYPE.BOND_CREATE:
        let bondDoc: IBond = {
          did: msgVal.bond_did,
          token: msgVal.token,
          name: msgVal.name,
          description: msgVal.description,
          creatorDid: msgVal.creator_did,
        };
        return this.bondSyncHandler.create(bondDoc);
      case this.TXN_TYPE.AGENT_CREATE:
        let agent: IAgent = {
          did: msgVal.data.did,
          role: msgVal.data.role,
          status: '0'
        };
        this.updateGlobalStats(this.TXN_TYPE.AGENT_CREATE, msgVal.data.role);
        return this.projectSyncHandler.addAgent(msgVal.projectDid, agent);
      case this.TXN_TYPE.AGENT_UPDATE:
        if (msgVal.data.status === '1') {
          this.updateGlobalStats(this.TXN_TYPE.AGENT_UPDATE, msgVal.data.role);
        }
        return this.projectSyncHandler.updateAgentStatus(msgVal.data.did, msgVal.data.status, msgVal.projectDid, msgVal.data.role);
      case this.TXN_TYPE.CAPTURE_CLAIM:
        let claim: IClaim = {
          claimId: msgVal.data.claimID,
          date: new Date(),
          location: {
            long: '33.9249° S',
            lat: '18.4241° E'
          },
          saDid: msgVal.senderDid,
          status: '0'
        };
        this.updateGlobalStats(this.TXN_TYPE.CAPTURE_CLAIM, '', '0');
        return this.projectSyncHandler.addClaim(msgVal.projectDid, claim);
      case this.TXN_TYPE.CLAIM_UPDATE:
        this.updateGlobalStats(this.TXN_TYPE.CLAIM_UPDATE, '', msgVal.data.status);
        return this.projectSyncHandler.updateClaimStatus(msgVal.data.status, msgVal.projectDid, msgVal.data.claimID, msgVal.senderDid);
      case this.TXN_TYPE.ADD_CREDENTIAL:
        let credential: ICredential = {
          type: msgVal.credential.type,
          claim: msgVal.credential.claim,
          issuer: msgVal.credential.issuer
        };
        return this.didSyncHandler.addCredential(msgVal.credential.claim.id, credential);
      case this.TXN_TYPE.PROJECT_STATUS_UPDATE:
        return this.projectSyncHandler.updateProjectStatus(msgVal.data.status, msgVal.projectDid);
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
