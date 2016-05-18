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
var result = require('./result-check.js');

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

var DASConnector = ioClient.connect('http://localhost:9000');
var activeUserPool = [];
var gameRoomsPool = [];
var currentRoomID = 0;

ioServer.on('connection', function (socket) {
  DASConnector.emit('new user arrived');



  socket.on('new userName submit', function (name) {
    DASConnector.emit('new userName submit', name);
    socket.join("global");
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
        grid: new f2dA(7, 7, null),
        currentPlayerMove: 1,
        winner: null
      } // 7x7 size hack because of lib bug
      gameRoomsPool.push(gameRoom);
      ioServer.sockets.in('global').emit('room initialized', gameRoom.id);
      socket.join(gameRoom.id);
      gameRoom = null;
    } else {
      socket.to(user.socket).emit("waiting for opponent");
    }
  });

  socket.on("user click", function (room, userSocketID, col, row) {
    try {
      if (userSocketID ===
        gameRoomsPool[room].players[gameRoomsPool[room].currentPlayerMove].socket) {
        ioServer.sockets.emit("opponent's turn");
        return;
      } else
      if (!gameRoomsPool[room].grid.get(row, col)) {
        gameRoomsPool[room].grid.set(row, col, userSocketID);
        gameRoomsPool[room].winner =
          result.check(gameRoomsPool[room].grid, col, row, userSocketID, room);

        ioServer.sockets.emit("grid update", col, row, userSocketID, JSON.stringify(
          gameRoomsPool[room].players));

        if (gameRoomsPool[room].winner) {
          ioServer.sockets.emit("winner", userSocketID);
        }
      }
      gameRoomsPool[room].currentPlayerMove = +!gameRoomsPool[room].currentPlayerMove;
    } catch (e) {
      console.error(e);
    }
  });
});
app.listen(app.get('port'), function () {
  console.log('Business Layer Server started: localhost:8000');
});

