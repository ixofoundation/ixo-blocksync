require("log-timestamp");
require("dotenv").config();

import "./util/long";
import http from "http";
import * as SyncBlocks from "./sync/sync_blocks";
import { DATABASE_URL, PORT, MIGRATE_DB_PROGRAMATICALLY } from "./util/secrets";
import * as SyncChain from "./sync/sync_chain";
import { postgresMigrate } from "./postgres/migrations";
import { initWebSocketServer } from "./websocket/server";

(async () => {
  // first apply db migrations if env var set, for prod dbs where no access to shell
  if (MIGRATE_DB_PROGRAMATICALLY) {
    console.log("MIGRATE_DB_PROGRAMATICALLY: ", MIGRATE_DB_PROGRAMATICALLY);
    await postgresMigrate(DATABASE_URL || "");
  }

  // Dynamic import of `./app` so Postgraphile's eager schema introspection
  // happens AFTER migrations have run. Static `import { app }` at the top
  // of the file would resolve before this async function fires, leaving
  // Postgraphile's GraphQL schema cached against a pre-migration (empty)
  // DB on a fresh boot. See:
  // https://github.com/graphile/postgraphile/issues/919
  const { app } = await import("./app");

  // server setup and start logic
  SyncChain.syncChain().then(() => SyncBlocks.startSync());

  const server = http.createServer(app);

  // Initialize WebSocket server on the same HTTP server
  initWebSocketServer(server);

  server.listen(PORT, () => console.log(`Listening on ${PORT}`));
})();
