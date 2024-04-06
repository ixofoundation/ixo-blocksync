require("log-timestamp");
require("dotenv").config();

import { app } from "./app";
import http from "http";
import * as SyncBlocks from "./sync/sync_blocks";
import { DATABASE_URL, PORT, MIGRATE_DB_PROGRAMATICALLY } from "./util/secrets";
import * as SyncChain from "./sync/sync_chain";
import * as SyncBlocksCustom from "./sync/sync_custom";
import { prismaMigrate } from "./prisma/migration";

(async () => {
  // first apply db migrations if env var set, for prod dbs where no access to shell
  if (MIGRATE_DB_PROGRAMATICALLY) {
    console.log("MIGRATE_DB_PROGRAMATICALLY: ", MIGRATE_DB_PROGRAMATICALLY);
    await prismaMigrate(DATABASE_URL || "");
  }

  // server setup and start logic
  SyncChain.syncChain().then(() => SyncBlocks.startSync());

  const server = http.createServer(app);
  server.listen(PORT, () => console.log(`Listening on ${PORT}`));
})();
