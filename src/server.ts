require('dotenv').config();
import * as http from 'http';
import App from './app';
import MongoUtils from './db/mongo_utils';
import {SyncBlocks} from './util/sync_blocks';

// Set the port
const port = (process.env.PORT || 8080);
const chainUri = (process.env.CHAIN_URI || 'http://localhost:26657');
const bcRest = (process.env.BC_REST || 'http://localhost:1317');

App.set('port', port);
App.set('chainUri', chainUri);
App.set('bcRest', bcRest);
const server = http.createServer(App);
export var io = require('socket.io')(server);

io.on('connection', function (socket) {
  io.emit('success', 'app to explorer connected');
});

let mongoDB = new MongoUtils(server, Number(port));

mongoDB.connectToDb();

let syncBlocks = new SyncBlocks();

syncBlocks.startSync(chainUri, bcRest);
