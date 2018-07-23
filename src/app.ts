import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as logger from './util/logger';
import * as compression from 'compression';
import { ProjectHandler } from './handlers/project_handler';
import { DidHandler } from './handlers/did_handler';
import { StatsHandler } from './handlers/stats_handler';

class App {
	// ref to Express instance
	public express: express.Application;

	// Run configuration methods on the Express instance.
	constructor() {
		this.express = express();
		this.middleware();
		this.routes(new ProjectHandler(), new DidHandler(), new StatsHandler());
	}

	// Configure Express middleware.
	private middleware(): void {
		this.express.use(cors());
		this.express.use(bodyParser.urlencoded({ extended: true }));
		this.express.use(bodyParser.json());
		this.express.use(logger.before);
		this.express.use(compression());
	}

	// Configure API endpoints.
	private routes(projectHandler: ProjectHandler, didHandler: DidHandler, statsHandler: StatsHandler): void {
		// GET REQUESTS
		this.express.get('/', (req, res) => {
			res.send('API is running');
		});

		this.express.get('/api/project/listProjects', (req, res) => {
			projectHandler.listAllProjects().then((projectList: any) => {
				res.send(projectList);
			});
		});

		this.express.get('/api/project/getByProjectDid/:projectDid', (req, res) => {
			projectHandler.listProjectByProjectDid(req.params.projectDid).then((projectData: any) => {
				res.send(projectData);
			});
		});

		this.express.get('/api/did/getByDid/:did', (req, res) => {
			didHandler.getDidDocByDid(req.params.did).then((didDoc: any) => {
				res.send(didDoc);
			});
		});

		this.express.get('/api/stats/listStats', (req, res) => {
			statsHandler.getStatsInfo().then((stats: any) => {
				res.send(stats);
			});
		});

		this.express.use(logger.after);
	}
}

export default new App().express;
