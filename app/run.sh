#!/bin/bash
sudo killall node -q
node ./business_logic/business_layer_server.js &
node ./data_access/data_access_server.js &
echo [PRESS ENTER TO TERMINATE]
