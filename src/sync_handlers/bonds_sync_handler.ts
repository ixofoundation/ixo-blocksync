import {IBond} from '../models/bonds';
import {BondDB} from '../db/models/bonds';
import {io} from '../server';

export class BondSyncHandler {
  create = (bondDoc: IBond) => {
    return new Promise((resolve: Function, reject: Function) => {
      return BondDB.create(bondDoc, (err, res) => {
        if (err) {
          reject(err);
        } else {
          io.emit('bond created', bondDoc);
          resolve(res);
        }
      });
    });
  };
}
