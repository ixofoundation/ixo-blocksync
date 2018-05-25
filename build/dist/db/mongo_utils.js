"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
var mongoose = require('mongoose');
var secrets_1 = require("../util/secrets");
var MongoUtils = /** @class */ (function () {
    function MongoUtils(server, port) {
        this.server = server;
        this.port = this.normalizePort(port);
        this.connectToDb = this.connectToDb.bind(this);
        this.onListening = this.onListening.bind(this);
        this.onError = this.onError.bind(this);
    }
    MongoUtils.prototype.connectToDb = function () {
        var self = this;
        require('mongoose').Promise = global.Promise;
        mongoose.connect(secrets_1.MONGODB_URI || '');
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'Mongo connection error: Cannot start'));
        db.once('open', function () {
            console.log('MongDB connected!');
            // Once connected listen on server
            self.server.listen(self.port);
            self.server.on('error', self.onError);
            self.server.on('listening', self.onListening);
        });
        process.on('SIGTERM', function () {
            db.close();
            self.server.close(function () {
                process.exit(0);
            });
        });
    };
    MongoUtils.prototype.onError = function (error) {
        if (error.syscall !== 'listen') {
            throw error;
        }
        var bind = (typeof this.port === 'string') ? 'Pipe ' + this.port : 'Port ' + this.port;
        switch (error.code) {
            case 'EACCES':
                console.log(bind + " requires elevated privileges");
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.log(bind + " is already in use");
                process.exit(1);
                break;
            default:
                throw error;
        }
    };
    MongoUtils.prototype.onListening = function () {
        var addr = this.server.address();
        var bind = (typeof addr === 'string') ? "pipe " + addr : "port " + addr.port;
        console.log("Listening on " + bind);
    };
    MongoUtils.prototype.normalizePort = function (val) {
        var port = (typeof val === 'string') ? parseInt(val, 10) : val;
        if (isNaN(port)) {
            return val;
        }
        else if (port >= 0) {
            return port;
        }
        else {
            return false;
        }
    };
    return MongoUtils;
}());
exports.default = MongoUtils;
//# sourceMappingURL=mongo_utils.js.map