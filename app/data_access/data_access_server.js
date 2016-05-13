var path = require('path');
var express = require('express');
var http = require('http');
var app = express();
var server = app.listen(9000);
var ioServer = require('socket.io').listen(server);
var ioClient = require('socket.io-client');
var f2dA = require('fixed-2d-array');

var BLSSocket = null;
var usersQueue = [];
var userID = 0;


ioServer.on('connection', function (socket) {
  console.log('DAS: BLS connected');
  BLSSocket = ioClient.connect('http://localhost:8000');
  socket.on('new userName submit', function (name) {
    try {
      usersQueue.push({
        key: userID,
        name: name.name //TODO: fix this
      })
      BLSSocket.emit('newUserName ack', JSON.stringify(usersQueue[userID++]));
    } catch (e) {
      console.error(e);
    }
  })
});

app.listen(app.get('port'), function () {
  console.log('Data Access Server started: localhost:9000');
});
