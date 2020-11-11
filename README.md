# ixo-blocksync
Syncs all the public info from an ixo blockchain to an instance of MongoDB

## Run from Source
**Requirements**: [MongoDB](https://docs.mongodb.com/manual/installation/)

Copy `.env-example` to `.env` and configure, and then:
```bash
npm install
npm run build
npm start
```

## Run using Docker (with Compose)
**Requirements**: [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/)

Configure environment in `docker-compose.yml`, especially `CHAIN_URI` and `BC_REST`, then:
```bash
mkdir ./data/       # may need to give write permission
mkdir ./data/db/    # may need to give write permission
npm install         # npm version used: 6.14.5; this creates node_modules/ folder
npm run build       # npm version used: 6.14.5; this creates build/ folder
bash bin/start.sh   # may need to superuser privileges
```

## Notes about Events
- **Warning**: Setting blocksync to accept all events leads to a lot of events
- Note that setting `ONLY_EVENTS` means that `IGNORE_EVENTS` becomes irrelevant
- To ignore all events, one can set `ONLY_EVENTS` to some random string
