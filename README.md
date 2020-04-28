# ixo-blocksync
Syncs all the public info from the ixo blockchain to mongodb

## Run from Source
Configure `.env-example` and then:
```
npm install
npm start
```

## Run using Docker (with Compose)
Configure environment in `docker-compose.yml` and then:
```
cd bin/
sudo bash start.sh
```

## Notes about Events
- **Warning**: Setting blocksync to accept all events leads to a lot of events
- Note that setting `ONLY_EVENTS` means that `IGNORE_EVENTS` becomes irrelevant
- To ignore all events, one can set `ONLY_EVENTS` to some random string
