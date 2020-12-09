import {BondDB} from '../db/models/bonds';
import {io} from '../server';

declare var Promise: any;

export class BondsHandler {
  listAllBonds = () => {
    return new Promise((resolve: Function, reject: Function) => {
      return BondDB.find({}, (err, res) => {
        if (err) {
          reject(err);
        } else {
          io.emit('list all bonds', res);
          resolve(res);
        }
      });
    });
  };

  listAllBondDids = () => {
    return new Promise((resolve: Function, reject: Function) => {
      return BondDB.find({}, {did: true}, (err, res) => {
        if (err) {
          reject(err);
        } else {
          io.emit('list all bond DIDs', res);
          resolve(res);
        }
      });
    });
  };

  listAllBondTokens = () => {
    return new Promise((resolve: Function, reject: Function) => {
      return BondDB.find({}, {token: true}, (err, res) => {
        if (err) {
          reject(err);
        } else {
          io.emit('list all bond tokens', res);
          resolve(res);
        }
      });
    });
  };

  listBondByBondDid = (bondDid: string) => {
    if (bondDid == undefined) {
      return new Promise((resolve: Function, reject: Function) => {
        reject(new Error("'bondDid' not specified in params"));
      });
    } else {
      return new Promise((resolve: Function, reject: Function) => {
        BondDB.findOne({did: bondDid}, (err, res) => {
          if (err) {
            reject(err);
          } else {
            io.emit('list bond', res);
            resolve(res);
          }
        });
      });
    }
  };

  listBondByCreatorDid = (params: any) => {
    if (params.creatorDid == undefined) {
      return new Promise((resolve: Function, reject: Function) => {
        reject(new Error("'creatorDid' not specified in params"));
      });
    } else {
      return new Promise((resolve: Function, reject: Function) => {
        BondDB.find({creatorDid: params.creatorDid}, (err, res) => {
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
