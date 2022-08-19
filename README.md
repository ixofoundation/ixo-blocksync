# ixo-blocksync
Syncs all the public info from an ixo blockchain to an instance of MongoDB.

## API Documentation
Refer to [src/schema/api.yml](src/schema/api.yml) or visit [the online version](https://app.swaggerhub.com/apis-docs/drshaun/ixo/0.2.3).

## Notes about Events
- **Warning**: Setting blocksync to accept all events leads to a lot of events
- Note that setting `ONLY_EVENTS` means that `IGNORE_EVENTS` becomes irrelevant
- To ignore all events, one can set `ONLY_EVENTS` to some random string

## Run
---
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

```bash
docker build .
docker compose up
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