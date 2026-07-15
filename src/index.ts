require("log-timestamp");
require("dotenv").config();

import "./util/long";
import http from "http";
import * as Sentry from "@sentry/node";
import * as SyncBlocks from "./sync/sync_blocks";
import * as SyncChain from "./sync/sync_chain";
import { postgresMigrate } from "./postgres/migrations";
import {
  DATABASE_URL,
  MIGRATE_DB_PROGRAMATICALLY,
  PORT,
  SENTRYDSN,
} from "./util/secrets";
import { app } from "./app";
import { startCrons } from "./crons";

(async () => {
  // Error capture for the sync process (uncaught exceptions/rejections);
  // no request tracing - there is no request traffic to trace.
  Sentry.init({ dsn: SENTRYDSN });

  // first apply db migrations if env var set, for prod dbs where no access to shell
  if (MIGRATE_DB_PROGRAMATICALLY) {
    console.log("MIGRATE_DB_PROGRAMATICALLY: ", MIGRATE_DB_PROGRAMATICALLY);
    await postgresMigrate(DATABASE_URL || "");
  }

  SyncChain.syncChain().then(() => SyncBlocks.startSync());
  startCrons();

  http
    .createServer(app)
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
})();
