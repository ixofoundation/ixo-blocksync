"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var abstract_router_1 = require("./abstract_router");
var project_handler_1 = require("../handlers/project_handler");
var ProjectRouter = /** @class */ (function (_super) {
    __extends(ProjectRouter, _super);
    function ProjectRouter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ProjectRouter.prototype.setup = function () {
        var config = {};
        var handler = new project_handler_1.ProjectHandler();
        this.register(config, 'create', handler.create);
        this.register(config, 'listProjects', handler.listAllProjects);
        this.register(config, 'listProjectByDid', handler.listProjectByDid);
        this.register(config, 'listProjectStats', handler.listProjectStats);
        return config;
    };
    return ProjectRouter;
}(abstract_router_1.AbstractRouter));
exports.ProjectRouter = ProjectRouter;
exports.default = new ProjectRouter().router;
//# sourceMappingURL=project_router.js.map