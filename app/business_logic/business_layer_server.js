"use strict";
var path = require('path');
var express = require('express');
var http = require('http');
var app = express();
var server = app.listen(8000);
var ioServer = require('socket.io').listen(server);
var ioClient = require('socket.io-client');
var session = require('express-session');
var f2dA = require('fixed-2d-array');
var redisStore = require('connect-redis')(session);
var cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(session({
  store: new redisStore(),
  secret: 'sssecret'
}));
app.use(require('express-promise')());
app.use('/', express.static(path.join(__dirname, '../presentation')));
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

var DASConnector = null;
var activeUserPool = [];
var gameRoomsPool = [];
var currentRoomID = 0;

ioServer.on('connection', function (socket) {
  if (!DASConnector) { // singleton to prevent multiple DAS instances
    DASConnector = ioClient.connect('http://localhost:9000');
    DASConnector.emit('new user arrived')
  }
  socket.on('new userName submit', function (name) {
    DASConnector.emit('new userName submit', name);
  });
  socket.on('newUserName ack', function (acknowledgedNewUser) {
    ioServer.sockets.emit('newUserName ack', acknowledgedNewUser);
  });
  socket.on('user will join room', function (user) {
    activeUserPool.push(user);
    if (user.id % 2) {
      let gameRoom = {
        players: activeUserPool.slice(-2),
        id: currentRoomID++,
        grid: new f2dA(7,6,null),
      }
      gameRoomsPool.push(gameRoom);
      ioServer.sockets.emit("room initialized", gameRoom.id);
      gameRoom = null;
    } else {
      socket.to(user.socket).emit("waiting for opponent");
    }
  });
  socket.on("user click", function (roomID, userID, col, row) {
    //gameRoomsPool.get(roomID).grid.set(col,row, userID);
  });
});

app.listen(app.get('port'), function () {
  console.log('Business Layer Server started: localhost:8000');
});
