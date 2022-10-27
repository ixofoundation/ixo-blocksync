# ixo-blocksync
![GitHub contributors](https://img.shields.io/github/contributors/ixofoundation/ixo-blocksync) ![GitHub repo size](https://img.shields.io/github/repo-size/ixofoundation/ixo-blocksync) ![Lines of code](https://img.shields.io/tokei/lines/github/ixofoundation/ixo-blocksync?style=plastic) ![Docker Pulls](https://img.shields.io/docker/pulls/northroomza/ixo-blocksync) ![Twitter Follow](https://img.shields.io/twitter/follow/ixoworld?style=social) ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

Syncs all the public info from an ixo blockchain to an instance of PostgreSQL.


## API Documentation
Refer to [src/schema/api.yml](src/schema/api.yml) or visit [the online version](https://app.swaggerhub.com/apis-docs/drshaun/ixo/0.2.3).

## Notes about Events
- **Warning**: Setting blocksync to accept all events leads to a lot of events
- Note that setting `ONLY_EVENTS` means that `IGNORE_EVENTS` becomes irrelevant
- To ignore all events, one can set `ONLY_EVENTS` to some random string

## Run
### From Source
Requirements
- [PostgreSQL](https://www.postgresql.org/download/)
- [Redis](https://redis.io/download/)

```bash
git clone https://github.com/ixofoundation/ixo-blocksync.git
cd ixo-blocksync/
```

Copy `.env.example` to `.env` and configure. If this step is skipped, ixo-blocksync will use `.env.example` as the configuration by default.

- Create a database called Blocksync

```bash
npm install
npx prisma migrate reset
npx prisma generate
npm run build
npm start
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
Delete the seed folder in src/seed/* if you do not plan to import data from json  
Create a role(e.g. app_user) in the DB for postgress to work

```bash
docker build -t ixofoundation/ixo-blocksync:latest .
docker compose up -d
```
---
### Seeding the Database with Previous MongoDB Data
- Export all collections as JSON from the block-sync MongoDB database
- Place the resulting JSON files within the `src/seed/json_exports` directory
- Configure `DATABASE_URL` in `.env` with the correct username, password and host

Local PostgreSQL
- Create a database called Blocksync

```bash
npx prisma migrate reset
npx prisma generate
npx ts-node src/seed/seed.ts
```

Docker PostgreSQL
```bash
docker build .
docker compose up block-sync-db
npx prisma generate
npx ts-node src/seed/seed.ts
```
