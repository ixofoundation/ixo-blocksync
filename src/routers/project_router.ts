import { AbstractRouter } from './abstract_router';
import { ProjectHandler } from '../handlers/project_handler';

export class ProjectRouter extends AbstractRouter {

    setup() {
        let config = {};
        const handler = new ProjectHandler();
        this.register(config, 'create', handler.create);
        this.register(config, 'listProjects', handler.listAllProjects);
        this.register(config, 'listProjectByProjectDid', handler.listProjectByProjectDid);
        this.register(config, 'listProjectBySenderDid', handler.listProjectBySenderDid);
        return config;
    }
}

export default new ProjectRouter().router;
