import { AbstractRouter } from './abstract_router';
import { StatsHandler } from '../handlers/stats_handler';

export class StatsRouter extends AbstractRouter {

    setup() {
        let config = {};
        const handler = new StatsHandler();
        this.register(config, 'listStats', handler.getStatsInfo);
        return config;
    }
}

export default new StatsRouter().router;
