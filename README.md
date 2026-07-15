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
