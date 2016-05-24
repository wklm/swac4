"use strict";
var path = require('path');
var express = require('express');
var http = require('http');
var app = express();
var server = app.listen(9000);
var ioServer = require('socket.io').listen(server);
var ioClient = require('socket.io-client');
var f2dA = require('fixed-2d-array');

var BLSSocket = null;
var usersQueue = {};
var gameRooms = [];
var userID = 0;

ioServer.on('connection', function (socket) {
  BLSSocket = ioClient.connect('http://localhost:8000');
  socket.on('new userName submit', function (user) {
    try {
      if (!usersQueue[user.name]) {
        usersQueue[user.name] = ({
          id: userID++,
          name: user.name,
          socket: user.socket,
          chosenVariant: user.chosenVariant
        });
        BLSSocket.emit('newUserName ack', JSON.stringify(usersQueue[user.name]));
      } else {
        BLSSocket.emit('newUserName negative ack', user.name, user.socket); //TODO: bls, pre
      }
    } catch (e) {
      console.error(e);
    }
  })
});

app.listen(app.get('port'), function () {
  console.log('Data Access Server started: localhost:9000');
});
