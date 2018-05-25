"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var project_1 = require("../db/models/project");
var ProjectHandler = /** @class */ (function () {
    function ProjectHandler() {
        this.create = function (project) {
            return new Promise(function (resolve, reject) {
                return project_1.ProjectDB.create(project, function (err, res) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                });
            });
        };
        this.list = function () {
            return new Promise(function (resolve, reject) {
                return project_1.ProjectDB.find({}, function (err, res) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                });
            });
        };
    }
    return ProjectHandler;
}());
exports.ProjectHandler = ProjectHandler;
//# sourceMappingURL=project_handler.js.map