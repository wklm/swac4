#!/bin/bash
sudo killall node -q
cd ./business_logic/
sudo npm install
cd ../data_access/
sudo npm install
cd ..
clear
node ./business_logic/business_layer_server.js &
node ./data_access/data_access_server.js &


