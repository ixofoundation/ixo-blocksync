import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as logger from './util/logger';
import * as compression from 'compression';
import {ProjectHandler} from './handlers/project_handler';
import {DidHandler} from './handlers/did_handler';
import {StatsHandler} from './handlers/stats_handler';
import {EventHandler} from "./handlers/event_handler";
import {Connection} from './util/connection';
import {AuthHandler} from './handlers/auth_handler';


class App {
  // ref to Express instance
  public express: express.Application;

  // Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.middleware();
    this.routes(
      new AuthHandler(), new ProjectHandler(), new DidHandler(),
      new EventHandler(), new StatsHandler()
    );
  }

  // Configure Express middleware.
  private middleware(): void {
    this.express.use(cors());
    this.express.use(bodyParser.urlencoded({extended: true}));
    this.express.use(bodyParser.json());
    this.express.use(logger.before);
    this.express.use(compression());
  }

  // Configure API endpoints.
  private routes(authHandler: AuthHandler, projectHandler: ProjectHandler,
                 didHandler: DidHandler, eventHandler: EventHandler,
                 statsHandler: StatsHandler): void {
    // GET REQUESTS
    this.express.get('/', (req, res) => {
      res.send('API is running');
    });

    this.express.get('/api/project/listProjects', (req, res, next) => {
      projectHandler.listAllProjects().then((projectList: any) => {
        res.send(projectList);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/project/getByProjectDid/:projectDid', (req, res, next) => {
      projectHandler.listProjectByProjectDid(req.params.projectDid).then((projectData: any) => {
        res.send(projectData);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/project/shields/status/:projectDid', (req, res, next) => {
      projectHandler.listProjectByProjectDid(req.params.projectDid).then((projectData: any) => {
        res.send({
          "schemaVersion": 1,
          "label": "status",
          "message": projectData.status ? projectData.status : "null",
          "color": "blue",
          "cacheSeconds": 300
        });
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/project/getProjectAccounts/:projectDid', (req, res, next) => {
      projectHandler.getProjectAccountsFromChain(req.params.projectDid)
        .then((response: any) => {
          res.send(response);
        })
        .catch((error) => {
          res.send(error);
        })
    });

    this.express.get('/api/did/getByDid/:did', (req, res, next) => {
      didHandler.getDidDocByDid(req.params.did).then((didDoc: any) => {
        res.send(didDoc);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/event/getEventByType/:type', (req, res, next) => {
      eventHandler.getEventsByType(req.params.type).then((event: any) => {
        res.send(event);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/stats/listStats', (req, res, next) => {
      statsHandler.getStatsInfo().then((stats: any) => {
        res.send(stats);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/blockchain/:tx', (req, res, next) => {
      let blockChainConnection = new Connection(this.express.get('chainURL'));
      blockChainConnection.sendTransaction(req.params.tx).then((result: any) => {
        res.send(result);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/sign_data/:msg', (req, res, next) => {
      authHandler.getSignData(req.params.msg)
        .then((response: any) => {
          res.send(response);
        })
        .catch((err) => {
          next(err);
        })
    });

    this.express.use(logger.after);
  }
}

export default new App().express;
