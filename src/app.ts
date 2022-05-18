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
import {BondsHandler} from "./handlers/bonds_handler";
// import { create } from 'apisauce'

class App {
  // ref to Express instance
  public express: express.Application;

  // Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.middleware();
    this.routes(
      new AuthHandler(), new ProjectHandler(), new BondsHandler(),
      new DidHandler(), new EventHandler(), new StatsHandler()
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
                 bondsHandler: BondsHandler, didHandler: DidHandler,
                 eventHandler: EventHandler, statsHandler: StatsHandler): void {
    // GET REQUESTS
    this.express.get('/', (req, res) => {
      res.send('API is running');
    });

 

    //get alpha updates

     //getBondWithdrawals
     this.express.get('/api/bond/get/alphas/:bonddid', (req, res, next) => {

      bondsHandler.getalphahistorybydid(req.params.bonddid).then((transactiondata: any) => {
        res.send(transactiondata);
      }).catch((err) => {
        next(err);
      });
    });


    //getBondWithdrawals
    this.express.get('/api/bond/get/transactions/:bonddid', (req, res, next) => {

      bondsHandler.gettransactionhistorybond(req.params.bonddid).then((transactiondata: any) => {
        res.send(transactiondata);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/bond/get/transactions/:entityType', (req, res, next) => {

      bondsHandler.gettransactionhistorybondbuyer(req.params.userdid).then((transactiondata: any) => {
        res.send(transactiondata);
      }).catch((err) => {
        next(err);
      });
    });

   
    //get withdraw History
    this.express.get('/api/bond/get/withdraw/reserve/bybonddid/:bonddid', (req, res, next) => {

      bondsHandler.getwithdrawhistoryfrombondreservebybonddid(req.params.bonddid).then((transactiondata: any) => {
        res.send(transactiondata);
      }).catch((err) => {
        next(err);
      });
    });
    this.express.get('/api/bond/get/withdraw/reserve/bywithdrawdid/:withdrawerdid', (req, res, next) => {

      bondsHandler.getwithdrawhistoryfrombondreservebywithdrawerdid(req.params.withdrawerdid).then((transactiondata: any) => {
        res.send(transactiondata);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/bond/get/withdraw/share/bybondid/:bonddid', (req, res, next) => {

      bondsHandler.getwithdrawhistoryfrombondsharebybonddid(req.params.bonddid).then((transactiondata: any) => {
        res.send(transactiondata);
      }).catch((err) => {
        next(err);
      });
    });
    this.express.get('/api/bond/get/withdraw/share/bywithdrawdid/:withdrawerdid', (req, res, next) => {

      bondsHandler.getwithdrawhistoryfrombondreservebywithdrawerdid(req.params.withdrawerdid).then((transactiondata: any) => {
        res.send(transactiondata);
      }).catch((err) => {
        next(err);
      });
    });

    // this.express.get('/api/bond/getpriceforbuyestimate/:entityType', (req, res, next) => {

    //   const api = create({baseURL: 'https://testnet.ixo.world/rest',})

    //   api
    //     .get('/repos/skellock/apisauce/commits')
    //     .then((response: any) => response.data[0].commit.message)
    //     .then(console.log)

    // });


    //End new apis

    this.express.get('/api/project/listProjects', (req, res, next) => {
      projectHandler.listAllProjects().then((projectList: any) => {
        res.send(projectList);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/project/listProjectsFiltered', (req, res, next) => {
      projectHandler.listAllProjectsFiltered(req.body).then((projectList: any) => {
        res.send(projectList);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/project/getByEntityType/:entityType', (req, res, next) => {
      projectHandler.listProjectByEntityType(req.params.entityType).then((projectData: any) => {
        res.send(projectData);
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

    this.express.get('/api/project/getByProjectSenderDid/:senderDid', (req, res, next) => {
      projectHandler.listProjectBySenderDid(req.params.senderDid).then((projectList: any) => {
        res.send(projectList);
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

    this.express.get('/api/bonds/listBonds', (req, res, next) => {
      bondsHandler.listAllBonds().then((bondsList: any) => {
        res.send(bondsList);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/bonds/listBondsFiltered', (req, res, next) => {
      bondsHandler.listAllBondsFiltered(req.body).then((bondsList: any) => {
        res.send(bondsList);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/bonds/getByBondDid/:bondDid', (req, res, next) => {
      bondsHandler.listBondByBondDid(req.params.bondDid).then((bondData: any) => {
        res.send(bondData);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/bonds/getPriceHistoryByBondDid/:bondDid', (req, res, next) => {
      bondsHandler.listBondPriceHistoryByBondDid(req.params.bondDid, req.body).then((bondData: any) => {
        res.send(bondData);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.get('/api/bonds/getByBondCreatorDid/:creatorDid', (req, res, next) => {
      bondsHandler.listBondByCreatorDid(req.params.creatorDid).then((bondsList: any) => {
        res.send(bondsList);
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

    this.express.post('/api/blockchain/txs', (req, res, next) => {
      const bcConn = new Connection(
        this.express.get('chainUri'),
        this.express.get('bcRest'),
        this.express.get('bondsInfoExtractPeriod'),
      );
      bcConn.sendTransaction(req.body).then((result: any) => {
        res.send(result);
      }).catch((err) => {
        next(err);
      });
    });

    this.express.post('/api/sign_data', (req, res, next) => {
      authHandler.getSignData(req.body.msg, req.body.pub_key)
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
