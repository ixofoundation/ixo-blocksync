import { promisify } from "node:util";
import { exec as execCb } from "node:child_process";

const exec = promisify(execCb);

// TODO: re-write this when Prisma.io gets a programmatic migration API
// https://github.com/prisma/prisma/issues/4703
export async function prismaMigrate(databaseUrl: string): Promise<void> {
  // throws an error if migration fails
  const { stdout, stderr } = await exec("npx prisma migrate deploy", {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  });
  console.log(stdout);
  console.log(stderr);
}

// If having migration issue due to custom db migrations before this etc, have a look at prisma failed migrate docs:
// https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing#failed-migration
// some options are to:
// 1. Apply the migration steps manually and mark as applied in db, 'prisma migrate resolve --applied "20201127134938_my_migration"'
// 2. Rollback the migration, 'prisma migrate resolve --rolled', to rerun migrations
// 3. Reset the db, 'prisma migrate reset --force', and rerun migrations
// 4. Manually apply all migrations directly fro cli, "npx prisma migrate deploy" and set env var MIGRATE_DB_PROGRAMATICALLY=0
