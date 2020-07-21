# ixo-blocksync
Syncs all the public info from the ixo blockchain to mongodb

## Run from Source
Copy `.env-example` to `.env` and configure, and then:
```bash
npm install
npm run build
npm start
```

## Run using Docker (with Compose)
Configure environment in `docker-compose.yml` and then:
```bash
mkdir ./data/db/    # may need to give write permission
npm install
npm run build
cd bin/
bash start.sh       # may need to superuser privileges
```

## Notes about Events
- **Warning**: Setting blocksync to accept all events leads to a lot of events
- Note that setting `ONLY_EVENTS` means that `IGNORE_EVENTS` becomes irrelevant
- To ignore all events, one can set `ONLY_EVENTS` to some random string
