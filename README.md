# ixo-blocksync 

[![ixo](https://img.shields.io/badge/ixo-project-blue)](https://ixo.foundation)
[![GitHub](https://img.shields.io/github/stars/ixofoundation/jambo?style=social)](https://github.com/ixofoundation/ixo-blocksync)
![GitHub repo size](https://img.shields.io/github/repo-size/ixofoundation/ixo-blocksync)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/ixofoundation/jambo/blob/main/LICENSE)

![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)![GraphQL](https://img.shields.io/badge/-GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white)

Syncs all the public info from an ixo blockchain to an instance of PostgreSQL. It gets fed from a [ixo-blocksync-core](https://github.com/ixofoundation/ixo-blocksync-core) database in order to speed up indexing and put less strain on nodes, which means you need an ixo-blocksync-core database connection in order to run this.

> For now the only source for information is a ixo-blocksync-core database connection, but we plan on expanding that to different sources in the near future.

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

## API interface

The server exposes a Graphql api endpoint at `/graphql` which is set up using [Postgraphile](https://www.graphile.org/postgraphile/) along with some plugins:

- [pg-simplify-inflector](https://github.com/graphile/pg-simplify-inflector)
- [postgraphile-plugin-connection-filter](https://github.com/graphile-contrib/postgraphile-plugin-connection-filter)
- [pg-aggregates](https://github.com/graphile/pg-aggregates)

A graphiql playground gets exposed at the endpoint `/graphiql` where you can play around, test queries and see the schemas.

We also generate and expose the full graphql schema file (schema.graphql) under the endpoint `/api/graphql_schema` if you need it to generate clients.
