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

Schema changes are files in `src/postgres/migrations/`, run by
[node-pg-migrate](https://github.com/salsita/node-pg-migrate) (`yarn migrate:up`,
`migrate:down`, `migrate:create`). With `MIGRATE_DB_PROGRAMATICALLY=1` (set in
every deployed environment) the indexer applies pending migrations **at
startup**. Order (`src/index.ts`): the HTTP port opens first, so the k8s
liveness probe on `GET /` keeps passing however long a migration takes; then
migrations run; only then do block sync and the cron jobs start, so nothing
writes to the database while a migration runs. A failed migration exits the
process and Kubernetes restarts the pod.

Everything a database needs comes from these files: a fresh, empty database
reaches the current schema by starting the indexer, with no manual steps.

**Large indexes on existing tables:** a plain `CREATE INDEX` blocks writes for
the whole build. Use a JavaScript migration that calls `pgm.noTransaction()`
and runs `CREATE INDEX CONCURRENTLY IF NOT EXISTS`, dropping an INVALID
leftover of the same name first so an interrupted build retries cleanly
(example: `20261030100100000_message-value-gin-full.js`). Do not `SET`
session parameters such as `maintenance_work_mem` there: the indexer connects
through pgbouncer in transaction mode, where a session `SET` leaks onto a
pooled connection. Indexes built by hand before this pattern existed are
covered by `IF NOT EXISTS` and stay no-ops.

### `Message.value` containment index

`Message.value` (JSONB, the full message content) has an ordinary GIN index,
`Message_value_gin_idx` (`jsonb_path_ops`), so "every message that mentions
object X" is an index lookup instead of a scan of the whole table. It serves
the `@>` operator only, which is the API's `value: { contains: … }` filter;
`containsKey` and friends are not indexed.

```graphql
query MessagesMentioning($id: String!) {
  messages(filter: { value: { contains: { id: $id } } }, first: 100, orderBy: ID_DESC) {
    totalCount
    nodes { id typeUrl transactionHash transactionByTransactionHash { height time } }
  }
}
```

Shapes that work the same way: `{ entity: "<did>" }`, `{ collectionId: "<id>" }`,
and `{ msgs: [{ id: "<did>" }] }` for messages wrapped in an authz `MsgExec`.

**`/ibc.core.client.v1.MsgUpdateClient` is not stored in `Message`** (nor its
`TransactionSigner` row). Those are IBC light-client headers (validator sets
and signatures, ~100 kB each): on mainnet 63,602 rows and 6.1 GB, 86% of the
table's bytes, never searched by content. The indexer skips them
(`SKIPPED_MESSAGE_TYPE_URLS` in `src/sync_handlers/transaction_sync.ts`); the
raw messages stay in blocksync-core (`MessageCore`) and on chain. The
transaction row is still written, and the other messages keep their original
`index`, so an IBC relay transaction shows one message fewer than on chain.
Migration `20261030100000000_drop-ibc-update-client-messages` removed the rows
already stored; `20261030100100000_message-value-gin-full` then replaced the
earlier partial index (`Message_value_nonibc_gin_idx`, which only served
queries that also said `typeUrl: { notEqualTo: "/ibc.core.client.v1.MsgUpdateClient" }`)
with this one, built `CONCURRENTLY` at startup. Queries that still send that
clause keep working; it is no longer needed.

Limit: GIN containment finds every match before ordering, so "newest N
messages mentioning X" is slow for an X that hundreds of thousands of messages
mention (for example mainnet claim collections 5 and 6). The fix for that is a
message-references table (Linear IXO-5676).

**Plans:** keep `plan_cache_mode = force_custom_plan` (the `blocksync` role has
it in all three environments and ixo-blocksync-api sets it per transaction). A
generic plan cannot estimate how selective a `$n` containment value is and
walks the primary key with a filter instead of using this index; with the
value planned in, Postgres uses the index.

A proper "message references" table is planned to replace this
(Linear IXO-5676).
