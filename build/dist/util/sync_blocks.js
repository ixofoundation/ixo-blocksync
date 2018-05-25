"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var connection_1 = require("./connection");
var block_1 = require("../models/block");
var chain_handler_1 = require("../handlers/chain_handler");
var CLI = require('clui'), Spinner = CLI.Spinner;
var SyncBlocks = /** @class */ (function () {
    function SyncBlocks() {
        this.chainHandler = new chain_handler_1.ChainHandler();
    }
    SyncBlocks.prototype.startSync = function (chainUri) {
        var _this = this;
        var conn = new connection_1.Connection(chainUri);
        this.chainHandler.getChainInfo().then(function (chain) {
            if (!chain) {
                _this.initChainInfo(conn).then(function (chain) {
                    _this.startQueue(conn, chain);
                });
            }
            else {
                _this.startQueue(conn, chain);
            }
        });
    };
    SyncBlocks.prototype.stopSync = function (blockQueue) {
        return blockQueue.stop();
    };
    SyncBlocks.prototype.initChainInfo = function (connection) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            connection.getLastBlock().then(function (block) {
                var chain = { chainId: block.header.chain_id, blockHeight: 0 };
                resolve(_this.chainHandler.create(chain));
            });
        });
    };
    SyncBlocks.prototype.startQueue = function (connection, chain) {
        var _this = this;
        var blockQueue = new block_1.BlockQueue(connection, chain.blockHeight);
        var sync = new Spinner('Syncing Blocks...  ', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);
        blockQueue.onBlock(function (event) {
            _this.chainHandler.setBlockHeight(event.getBlockHeight(), event.getChainId());
            sync.message('Syncing block number ' + event.getBlockHeight());
        });
        sync.start();
        blockQueue.start();
    };
    return SyncBlocks;
}());
exports.SyncBlocks = SyncBlocks;
//# sourceMappingURL=sync_blocks.js.map