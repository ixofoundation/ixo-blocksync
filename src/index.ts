require("log-timestamp");
require("dotenv").config();

import { app } from "./app";
import http from "http";
import * as SyncBlocks from "./sync/sync_blocks";
import { PORT } from "./util/secrets";
import * as SyncChain from "./sync/sync_chain";

SyncChain.syncChain().then(() => SyncBlocks.startSync());

const server = http.createServer(app);
server.listen(PORT, () => console.log(`Listening on ${PORT}`));
