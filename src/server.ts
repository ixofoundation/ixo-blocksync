require('dotenv').config();
require('log-timestamp');
import * as http from 'http';
import App from './app';
import MongoUtils from './db/mongo_utils';
import {SyncBlocks} from './util/sync_blocks';

// Set the port
const port = (process.env.PORT || 8080);
const chainUri = (process.env.CHAIN_URI || 'http://localhost:26657');
const bcRest = (process.env.BC_REST || 'http://localhost:1317');
const bondsInfoExtractPeriod = process.env.BONDS_INFO_EXTRACT_PERIOD_BLOCKS ?
  parseInt(process.env.BONDS_INFO_EXTRACT_PERIOD_BLOCKS) : undefined

App.set('port', port);
App.set('chainUri', chainUri);
App.set('bcRest', bcRest);
App.set('bondsInfoExtractPeriod', bondsInfoExtractPeriod);
const server = http.createServer(App);
export var io = require('socket.io')(server);

io.on('connection', function (socket) {
  io.emit('success', 'app to explorer connected');
});

let mongoDB = new MongoUtils(server, Number(port));

mongoDB.connectToDb();

let syncBlocks = new SyncBlocks();

syncBlocks.startSync(chainUri, bcRest, bondsInfoExtractPeriod);
