# PostgresQL

This guide outlines the setup and usage of PostgreSQL for the project. It covers connecting to the database, executing raw SQL queries with transactions, and managing database migrations.

## Connecting to the Database

In order to use the setup please ensure to add the following environment variable to your `.env` file, replacing `<your_database_url>` with the actual connection string for your PostgreSQL database:

```
DATABASE_URL=<your_database_url>
```

The `src/postgres/client.ts` file provides helper functions for connecting to the PostgreSQL database and managing transactions.
The `withTransaction` function simplifies executing queries within a single transaction and also a `ROLLBACK` in case an error occurrs. Below is an example:

```ts
const insertBlockSql = `
INSERT INTO "BlockCore" (height, hash, "time")
VALUES ($1, $2, $3);
`;
const insertTransactionSql = `
INSERT INTO "TransactionCore" (hash, code, fee, "gasUsed", "gasWanted", memo, "time", "blockHeight")
SELECT tr.hash, tr.code, tr.fee, tr."gasUsed", tr."gasWanted", tr.memo, $2, $3
FROM jsonb_to_recordset($1) AS tr(hash text, code int, fee jsonb, "gasUsed" text, "gasWanted" text, memo text);
`;
export const insertBlock = async (block: BlockCore): Promise<void> => {
  try {
    // do all the insertions in a single transaction
    await withTransaction(async (client) => {
      await client.query(insertBlockSql, [
        block.height,
        block.hash,
        block.time,
      ]);
      if (block.transactions.length) {
        await client.query(insertTransactionSql, [
          JSON.stringify(block.transactions),
          block.time,
          block.height,
        ]);
      }
    });
  } catch (error) {
    throw error;
  }
};
```

You can execute raw SQL queries using the connected client object. Remember to escape user-provided data to prevent SQL injection vulnerabilities. Below is an example:

```ts
const getChainSql = `
SELECT * FROM "ChainCore" WHERE "chainId" = $1
`;
export const getChain = async (chainId: string): Promise<Chain | undefined> => {
  try {
    const res = await pool.query(getChainSql, [chainId]);
    return res.rows[0];
  } catch (error) {
    throw error;
  }
};
```

## Database Migrations

The `src/postgres/migrations` folder contains migration scripts for managing your database schema changes. These scripts are executed programmatically using the `node-pg-migrate` package.

The `MIGRATE_DB_PROGRAMMATICALLY` environment variable controls programmatic migration execution. Set it to true in your `.env` file to enable automatic migrations on application startup.

### Migration Scripts

- Each migration script should be named with a utc string prefix and migration name (e.g. 00000000000000000_init.sql). Please use the provided `package.json` script `migrate:create` to create the files eg: `yarn migrate:create my_migration`
- The script should contain SQL statements for creating/altering tables, indexes, and constraints.
- Up and down migrations are defined within the script using comments:

```sql
-- ... Quick summary for migration on top

-- Up Migration
-- ... SQL statements for creating tables ...

-- Down Migration
-- ... SQL statements for dropping tables ...
```

### Running Migrations

The `package.json` file includes scripts for managing migrations:

- `migrate:up`: Applies all pending up migrations.
- `migrate:down`: Reverts the latest migration.
- `migrate:redo`: Re-applies the latest migration.
- `migrate:create`: Creates a new migration file with a timestamp prefix.

### Programatic Migration

The `postgresMigrate` function in `src/postgres/migrations` allows programmatic execution of migrations at startup if the `MIGRATE_DB_PROGRAMMATICALLY` environment variable is set. This is setup for those who dont have access to the db directly through cli, but is is also the preferred method for migrations on new releases as it doesnt need any intervention that could go wrong.

Please don't try to do any manual migrations and have this enabled as it will fail on server startup and the server tries to run the migrations!

## Conclusion

This guide provides a basic overview of using PostgreSQL with this project. Refer to the provided code examples for further details on connecting, executing queries, and managing migrations. Remember to consult the PostgreSQL documentation for more advanced features and functionalities.
