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

  // Health endpoint first. Kubernetes' liveness probe hits "/", so it must
  // answer while migrations run: a migration that takes longer than the probe
  // window (~35 s) would otherwise get the pod killed mid-migration and
  // crashloop. Nothing writes to the database until migrations are done.
  await new Promise<void>((resolve) =>
    http.createServer(app).listen(PORT, () => {
      console.log(`Listening on ${PORT}`);
      resolve();
    })
  );

  // Apply db migrations if env var set, for prod dbs where no access to shell
  if (MIGRATE_DB_PROGRAMATICALLY) {
    console.log("MIGRATE_DB_PROGRAMATICALLY: ", MIGRATE_DB_PROGRAMATICALLY);
    try {
      await postgresMigrate(DATABASE_URL || "");
    } catch (error) {
      // The server is already listening, so an unhandled failure would leave
      // a "healthy" pod that never syncs. Exit so Kubernetes restarts it.
      console.error("ERROR::postgresMigrate:: ", error);
      Sentry.captureException(error);
      await Sentry.flush(2000);
      process.exit(1);
    }
  }

  // Sync and crons start only after the schema is current.
  SyncChain.syncChain().then(() => SyncBlocks.startSync());
  startCrons();
})();
