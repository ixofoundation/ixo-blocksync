import { AbstractRouter } from './abstract_router';
import { DidHandler } from '../handlers/did_handler';

export class DidRouter extends AbstractRouter {

    setup() {
        let config = {};
        const handler = new DidHandler();
        this.register(config, 'getDidDocByDid', handler.getDidDocByDid);
        return config;
    }
}

export default new DidRouter().router;
