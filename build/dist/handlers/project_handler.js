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
        this.listAllProjects = function (numberOfProjects) {
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
        this.listProjectByDid = function (params) {
            if (params.projectDid == undefined) {
                return new Promise(function (resolve, reject) {
                    reject(new Error("'projectDid' not specified in params"));
                });
            }
            else {
                return project_1.ProjectDB.find({ "projectDid": params.projectDid })
                    .exec();
            }
        };
        this.listProjectStats = function () {
        };
    }
    return ProjectHandler;
}());
exports.ProjectHandler = ProjectHandler;
//# sourceMappingURL=project_handler.js.map