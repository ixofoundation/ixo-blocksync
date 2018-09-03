import { ChainDB } from "../db/models/chain";
import { IChain } from "../models/chain";

export class ChainHandler {
    create = (chain: IChain) => {
        return new Promise((resolve: Function, reject: Function) => {
            return ChainDB.create(chain, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    update = (chain: IChain) => {
        return new Promise((resolve: Function, reject: Function) => {
            return ChainDB.update({}, { $set: { blockHeight: chain.blockHeight, chainId: chain.chainId } }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    setBlockHeight = (blockHeight: Number, chainId: string) => {
        return new Promise((resolve: Function, reject: Function) => {
            return ChainDB.update({ chainId: chainId }, { $set: { blockHeight: blockHeight } }, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    getChainInfo = () => {
        return new Promise((resolve: Function, reject: Function) => {
            return ChainDB.find({}, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res[0]);
                }
            });
        });
    }
}