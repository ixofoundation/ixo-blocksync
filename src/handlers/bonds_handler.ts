import {BondDB} from '../db/models/bonds';
import {io} from '../server';


declare var Promise: any;

export class BondsHandler {
  listAllBonds = () => {
    return new Promise((resolve: Function, reject: Function) => {
      // Return all bonds, excluding priceHistory parameter
      return BondDB.find({}, {priceHistory: false}, (err, res) => {
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
      // Return all bond DIDs, explicitly excluding priceHistory parameter
      return BondDB.find({}, {did: true, priceHistory: false}, (err, res) => {
        if (err) {
          reject(err);
        } else {
          io.emit('list all bond DIDs', res);
          resolve(res);
        }
      });
    });
  };

  listAllBondsFiltered = (fields: string[]) => {
    return new Promise((resolve: Function, reject: Function) => {
      // Return all bonds with parameters filtered (by default priceHistory excluded)
      const filter = {priceHistory: false}
      for (const i in fields) {
        filter[fields[i]] = true
      }
      return BondDB.find({}, filter, (err, res) => {
        if (err) {
          reject(err);
        } else {
          io.emit('list specified fields of all bond', res);
          resolve(res);
        }
      });
    });
  };

  listBondByBondDid = (bondDid: string) => {
    // Return bond by bond DID, excluding priceHistory parameter
    if (bondDid == undefined) {
      return new Promise((resolve: Function, reject: Function) => {
        reject(new Error("'bondDid' not specified in params"));
      });
    } else {
      return new Promise((resolve: Function, reject: Function) => {
        BondDB.findOne({did: bondDid}, {priceHistory: false}, (err, res) => {
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

  listBondPriceHistoryByBondDid = (bondDid: string, reqBody: any) => {
    // reqBody can contain fromTime and toTime, expected to be in milliseconds
    let fromTime: Date;
    let toTime: Date;
    if (reqBody.hasOwnProperty("fromTime")) {
      fromTime = new Date(parseInt(reqBody.fromTime));
    } else {
      fromTime = new Date(0);  // small date
    }
    if (reqBody.hasOwnProperty("toTime")) {
      toTime = new Date(parseInt(reqBody.toTime));
    } else {
      toTime = new Date(8640000000000000); // large date
    }

    // Return bond price history by bond DID
    if (bondDid == undefined) {
      return new Promise((resolve: Function, reject: Function) => {
        reject(new Error("'bondDid' not specified in params"));
      });
    } else {
      return new Promise((resolve: Function, reject: Function) => {
        BondDB.aggregate([
            {$match: {did: bondDid}},
            {$unwind: '$priceHistory'},
            {$match: {'priceHistory.time': {$gte: fromTime}}},
            {$match: {'priceHistory.time': {$lte: toTime}}},
            {$group: {_id: '$_id', priceHistory: {$push: '$priceHistory'}}},
          ],
          (err, res) => {
            if (err) {
              reject(err);
            } else {
              io.emit('list bond price history', res);
              resolve(res[0]);
            }
          })
      });
    }
  };

  listBondByCreatorDid = (creatorDid: string) => {
    // Return bond by bond creator DID, excluding priceHistory parameter
    if (creatorDid == undefined) {
      return new Promise((resolve: Function, reject: Function) => {
        reject(new Error("'creatorDid' not specified in params"));
      });
    } else {
      return new Promise((resolve: Function, reject: Function) => {
        BondDB.find({creatorDid}, {priceHistory: false}, (err, res) => {
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
