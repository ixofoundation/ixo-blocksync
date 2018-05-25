"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var Connection = /** @class */ (function () {
    function Connection(chainUri) {
        this.THRESHHOLD_FOR_WEBSOCKET = 10;
        this.chainUri = chainUri;
    }
    Connection.prototype.getBlock = function (height) {
        var url = 'http://' + this.chainUri + '/block?height=';
        if (height > 0) {
            url = url + height;
        }
        return axios_1.default
            .get(url)
            .then(function (response) {
            if (response.data.result) {
                return response.data.result.block;
            }
            else {
                throw new Error('No more blocks');
            }
        })
            .catch(function (error) {
            return '';
        });
    };
    Connection.prototype.getLastBlock = function () {
        return this.getBlock(-1);
    };
    Connection.prototype.getLastBlockHeight = function () {
        return this.getLastBlock().then(function (block) {
            return block.header.height;
        })
            .catch(function (error) {
            console.log(error);
            return -1;
        });
    };
    Connection.prototype.subscribeToChain = function (callback) {
        var ws = new WebSocket('ws://' + this.chainUri + '/websocket');
        ws.onmessage = function (event) {
            callback(JSON.parse(event.data.result.block));
        };
        ws.onopen = function () {
            ws.send("{\"jsonrpc\": \"2.0\", \"method\": \"subscribe\", \"params\": {\"query\": \"tm.event='NewBlock'\" }, \"id\": \"ixo-explorer\"}");
        };
    };
    return Connection;
}());
exports.Connection = Connection;
//# sourceMappingURL=connection.js.map