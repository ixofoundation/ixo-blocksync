"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var logger = require("../util/logger");
var jayson = require('jayson/promise');
var AbstractRouter = /** @class */ (function () {
    function AbstractRouter() {
        this.router = express_1.Router();
        this.init();
    }
    AbstractRouter.prototype.init = function () {
        this.router.post('/', jayson.server(this.setup()).middleware());
    };
    AbstractRouter.prototype.register = function (config, method, handlerFunction) {
        config[method] = function (args) {
            return new Promise(function (resolve, reject) {
                handlerFunction(args)
                    .then(function (data) { return resolve(data); })
                    .catch(function (err) {
                    logger.default.error(err.message, err);
                    reject(jayson.server().error(null, err.message));
                });
            });
        };
    };
    AbstractRouter.prototype.setup = function () { };
    return AbstractRouter;
}());
exports.AbstractRouter = AbstractRouter;
//# sourceMappingURL=abstract_router.js.map