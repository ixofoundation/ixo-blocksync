import {IBond, NewBondInfo, PriceEntry} from '../models/bonds';
import {BondDB} from '../db/models/bonds';
import {Transaction} from '../db/models/transactions';
import {WithdrawReserve} from '../db/models/reservewithdrawels';
import {WithdrawShare} from '../db/models/sharewithdrawels';
import {ITransactionEvent} from '../models/order';
import {IWithdrawReserveEvent} from '../models/withdraw_reserve';
import {IWithdrawShareEvent} from '../models/withdraw_share';
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

  createorder = (orderdoc: ITransactionEvent) => {
    return new Promise((resolve: Function, reject: Function) => {
      return Transaction.create(orderdoc, (err, res) => {
        if (err) {
          reject(err);
          console.log(err);
        } else {
          io.emit('order created', orderdoc);
          resolve(res);
        }
      });
    });
  };
  createbondsharewithdrawel = (bondsharewithdrawel: IWithdrawShareEvent) => {
    return new Promise((resolve: Function, reject: Function) => {
      return WithdrawShare.create(bondsharewithdrawel, (err, res) => {
        if (err) {
          reject(err);
          console.log(err);
        } else {
          io.emit('bond share withdrawel created', bondsharewithdrawel);
          resolve(res);
        }
      });
    });
  };
  createbondreservewithdrawel = (bondreservewithdrawel: IWithdrawReserveEvent) => {
    return new Promise((resolve: Function, reject: Function) => {
      return WithdrawReserve.create(bondreservewithdrawel, (err, res) => {
        if (err) {
          reject(err);
          console.log(err);
        } else {
          io.emit('bond reserve withdrawel created', bondreservewithdrawel);
          resolve(res);
        }
      });
    });
  };

  getLastPrice = (bondDid: string) => {
    return new Promise((resolve: Function, reject: Function) => {
      return BondDB.findOne({did: bondDid}, {lastPrice: {$arrayElemAt: ["$priceHistory", -1]}}, (err, res) => {
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
          lastPriceResult = lastPriceResult ? lastPriceResult.toJSON() : {}
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
