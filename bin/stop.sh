#!/bin/bash
#git clone https://github.com/ixofoundation/ixo-pds.git
green=`tput setaf 2`
echo "***********************************"
echo "* IXO BLOCK SYNC SHUTDOWN         *"
echo "***********************************"
echo ""
docker-compose stop
docker-compose rm
echo ""
echo "***********************************"
echo "* IXO BLOCK SYNC SHUTDOWN COMPLETE*"
echo "***********************************"