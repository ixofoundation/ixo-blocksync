"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chain_1 = require("../db/models/chain");
var ChainHandler = /** @class */ (function () {
    function ChainHandler() {
        this.create = function (chain) {
            return new Promise(function (resolve, reject) {
                return chain_1.ChainDB.create(chain, function (err, res) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                });
            });
        };
        this.setBlockHeight = function (blockHeight, chainId) {
            return new Promise(function (resolve, reject) {
                return chain_1.ChainDB.update({ chainId: chainId }, { $set: { blockHeight: blockHeight } }, function (err, res) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                });
            });
        };
        this.getChainInfo = function () {
            return new Promise(function (resolve, reject) {
                return chain_1.ChainDB.find({}, function (err, res) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res[0]);
                    }
                });
            });
        };
    }
    return ChainHandler;
}());
exports.ChainHandler = ChainHandler;
//# sourceMappingURL=chain_handler.js.map