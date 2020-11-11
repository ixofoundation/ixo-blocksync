#!/bin/bash

# git clone https://github.com/ixofoundation/ixo-blocksync.git
# cd ixo-blocksync

# Note: this script should be run from outside the bin folder

docker-compose up --no-start
docker-compose start block-sync-db

# attempting to wait for mongodb to be ready
./bin/wait-for-service.sh block-sync-db 'waiting for connections on port' 10
docker-compose start block-sync

docker-compose logs --tail 13 block-sync
echo ""
echo "***********************************"
echo "* IXO BLOCKSYNC COMPLETE          *"
echo "***********************************"
docker-compose ps
