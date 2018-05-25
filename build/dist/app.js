"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
var logger = require("./util/logger");
var project_router_1 = require("./routers/project_router");
var App = /** @class */ (function () {
    // Run configuration methods on the Express instance.
    function App() {
        this.express = express();
        this.middleware();
        this.routes();
    }
    // Configure Express middleware.
    App.prototype.middleware = function () {
        this.express.use(cors());
        this.express.use(bodyParser.urlencoded({ extended: true }));
        this.express.use(bodyParser.json());
        this.express.use(logger.before);
    };
    // Configure API endpoints.
    App.prototype.routes = function () {
        this.express.get('/', function (req, res, next) {
            res.send('API is running');
        });
        this.express.use('/api/project', project_router_1.default);
        this.express.use(logger.after);
    };
    return App;
}());
exports.default = new App().express;
//# sourceMappingURL=app.js.map