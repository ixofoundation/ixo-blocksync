# ixo-blocksync

[![ixo](https://img.shields.io/badge/ixo-project-blue)](https://ixo.foundation)
[![GitHub](https://img.shields.io/github/stars/ixofoundation/jambo?style=social)](https://github.com/ixofoundation/ixo-blocksync)
![GitHub repo size](https://img.shields.io/github/repo-size/ixofoundation/ixo-blocksync)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/ixofoundation/jambo/blob/main/LICENSE)

![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

Indexer-only service: syncs all the public info from an ixo blockchain to an instance of PostgreSQL (reads are served by [ixo-blocksync-api](https://github.com/ixofoundation/ixo-blocksync-api)). It gets fed from a [ixo-blocksync-core](https://github.com/ixofoundation/ixo-blocksync-core) database in order to speed up indexing and put less strain on nodes, which means you need an ixo-blocksync-core database connection in order to run this.

> For now the only source for information is a ixo-blocksync-core database connection, but we plan on expanding that to different sources in the near future

## Run

### From Source

Requirements

- [PostgreSQL](https://www.postgresql.org/download/)

```bash
git clone https://github.com/ixofoundation/ixo-blocksync.git
cd ixo-blocksync/
```

Copy `.env.example` to `.env` and configure. If this step is skipped, ixo-blocksync will use `.env.example` as the configuration by default.

- Create a database called Blocksync

```bash
yarn install
yarn build
yarn start
```

---

### Using Docker (with Compose)

Requirements

- [Docker](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

```bash
git clone https://github.com/ixofoundation/ixo-blocksync.git
cd ixo-blocksync/
```

Copy `.env.example` to `.env` and configure. If this step is skipped, ixo-blocksync will use `.env.example` as the configuration by default.
Don't use quotations when asign env vars for docker
Delete the seed folder in src/seed/\* if you do not plan to import data from json
Create a role(e.g. app_user) in the DB for postgress to work

```bash
docker build -t ixofoundation/ixo-blocksync:latest .
docker compose up -d
```

## Indexer only — no query API

ixo-blocksync is the **write half** of the blocksync pair: it indexes the
chain into PostgreSQL and runs the write-side cron jobs (tokenomics account
refresh, entity externalId resolution, claim schemaType fetch from cellnode).
All query traffic — GraphQL and REST — is served by
[ixo-blocksync-api](https://github.com/ixofoundation/ixo-blocksync-api) from
the same database.

The only public endpoints are for health monitoring:

| Path | Description |
| --- | --- |
| `GET /` | Plain liveness text ("Indexer is Running") — used by k8s probes |
| `GET /healthz` | DB round-trip returning the latest indexed `chainId` + `blockHeight`, so monitoring can verify the indexer is alive **and** progressing |

## Database migrations and indexes

Schema changes are SQL files in `src/postgres/migrations/`, run by
[node-pg-migrate](https://github.com/salsita/node-pg-migrate) (`yarn migrate:up`,
`migrate:down`, `migrate:create`). With `MIGRATE_DB_PROGRAMATICALLY=1` (set in
every deployed environment) the indexer applies pending migrations **at
startup, before it opens its HTTP port**. The k8s liveness probe on `GET /`
allows roughly 35 seconds, so a migration that takes longer than that restarts
the pod, rolls back, and crashloops.

**Rule for large indexes:** on an existing environment, build the index by hand
first, then deploy. `CREATE INDEX CONCURRENTLY` does not block the indexer's
writes, and the migration's `CREATE INDEX IF NOT EXISTS` is then a no-op that
records itself in `pgmigrations`. From the primary Postgres pod:

```sql
SET maintenance_work_mem = '512MB';
CREATE INDEX CONCURRENTLY IF NOT EXISTS "<name>" ON "<table>" ...;  -- same name and definition as the migration
```

Watch `pg_stat_progress_create_index`; confirm `indisvalid` in `pg_index` before
deploying. Never give a migration a name that would drop and rebuild a
hand-built index at startup.

### `Message.value` containment index

`Message.value` (JSONB, the full message content) has a GIN index,
`Message_value_nonibc_gin_idx` (`jsonb_path_ops`), so "every message that
mentions object X" is an index lookup instead of a scan of the whole table.
It serves the `@>` operator only, which is the API's `value: { contains: … }`
filter; `containsKey` and friends are not indexed.

The index is **partial**: it skips `/ibc.core.client.v1.MsgUpdateClient` (IBC
light-client headers: validator sets and signatures, ~100 kB each, 86% of the
table's bytes on mainnet and never searched by content). Those rows stay stored
and queryable by `typeUrl`, height and sender; every other message type,
including IBC transfers, packets and acknowledgements, is fully indexed.

Postgres only uses a partial index when the query's `WHERE` implies the index
predicate, so **a containment query must also say**
`"typeUrl" <> '/ibc.core.client.v1.MsgUpdateClient'`. Through
[ixo-blocksync-api](https://github.com/ixofoundation/ixo-blocksync-api):

```graphql
query MessagesMentioning($id: String!) {
  messages(
    filter: {
      typeUrl: { notEqualTo: "/ibc.core.client.v1.MsgUpdateClient" }
      value: { contains: { id: $id } }
    }
    first: 100
    orderBy: ID_DESC
  ) {
    totalCount
    nodes { id typeUrl transactionHash transactionByTransactionHash { height time } }
  }
}
```

Shapes that work the same way: `{ entity: "<did>" }`, `{ collectionId: "<id>" }`,
and `{ msgs: [{ id: "<did>" }] }` for messages wrapped in an authz `MsgExec`.
Without the `typeUrl` clause the same query is a sequential scan that times out
on mainnet. Measured on devnet (84k messages): 4 s → under 5 ms in the
database, ~250 ms end to end through the API, stable at 20 concurrent requests.

Sizes: the index is roughly 4× the stored size of what it covers (devnet
1 GB; mainnet ≈ 4 GB without the headers, ≈ 29 GB with them, which is why they
are excluded). A proper "message references" table is planned to replace this
(Linear IXO-5676).
