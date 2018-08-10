require('dotenv').config();
import * as http from 'http';
import App from './app';
import MongoUtils from './db/mongo_utils';
import { SyncBlocks } from './util/sync_blocks';

// Set the port
const port = (process.env.PORT || 8080);
const chainURL = (process.env.CHAIN_URI || 'localhost:46657');

App.set('port', port);
App.set('chainURL', chainURL);
const server = http.createServer(App);

let mongoDB = new MongoUtils(server, Number(port));

mongoDB.connectToDb();

let syncBlocks = new SyncBlocks();

syncBlocks.startSync(chainURL);


