import { AbstractRouter } from './abstract_router';
import { ProjectHandler } from '../handlers/project_handler';

export class ProjectRouter extends AbstractRouter {

    setup() {
        let config = {};
        const handler = new ProjectHandler();
        this.register(config, 'create', handler.create);
        this.register(config, 'listProjects', handler.listAllProjects);
        this.register(config, 'listProjectByDid', handler.listProjectByDid);
        this.register(config, 'listProjectStats', handler.listProjectStats);
        return config;
    }
}

export default new ProjectRouter().router;
