import {IBond, NewBondInfo, PriceEntry} from '../models/bonds';
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

  getLastPrice = (bondDid: string) => {
    return new Promise((resolve: Function, reject: Function) => {
      return BondDB.findOne({did: bondDid}, {lastPrice: {$last: "$priceHistory"}}, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  addBondInfo = (bondInfo: NewBondInfo) => {
    // Construct a new price entry from the bond info
    let priceEntry: PriceEntry = {
      price: bondInfo.spotPrice[0].amount,
      time: bondInfo.blockTimestamp
    }

    return new Promise((resolve: Function, reject: Function) => {
      // Get latest price and only append new price if previous price not the same
      this.getLastPrice(bondInfo.did)
        .then((lastPriceResult: any) => {
          lastPriceResult = lastPriceResult.toJSON()
          if (!lastPriceResult.lastPrice || lastPriceResult.lastPrice.price != priceEntry.price) {
            BondDB.updateOne(
              {did: bondInfo.did},
              {$push: {priceHistory: priceEntry}},
              (err, res) => {
                if (err) {
                  reject(err);
                } else {
                  io.emit('bond info updated', bondInfo.did);
                  resolve(res);
                }
              });
          }
        })
    });
  }
}
