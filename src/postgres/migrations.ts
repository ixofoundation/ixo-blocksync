import pg_migrate from "node-pg-migrate";
import { DATABASE_USE_SSL } from "../util/secrets";

export async function postgresMigrate(databaseUrl: string): Promise<void> {
  await pg_migrate({
    dir: "src/postgres/migrations",
    direction: "up",
    migrationsTable: "pgmigrations",
    databaseUrl: {
      connectionString: databaseUrl,
      ...(DATABASE_USE_SSL && { ssl: { rejectUnauthorized: false } }), // Use SSL (recommended
    },
  });
}
