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
  socket.on('new userName submit', function (user) {
    DASConnector.emit('new userName submit', user);
  });

  socket.on('newUserName ack', function (acknowledgedNewUser) {
    let user = JSON.parse(acknowledgedNewUser);
    ioServer.sockets.connected['/#' + user.socket].emit('newUserName ack', acknowledgedNewUser);
  });

  socket.on('newUserName negative ack', function (name, socket) { // name already taken
    ioServer.sockets.connected['/#' + socket].emit('newUserName negative ack', name);
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
      ioServer.sockets.connected['/#' + gameRoom.players[0].socket].emit('room initialized', gameRoom.id);
      ioServer.sockets.connected['/#' + gameRoom.players[1].socket].emit('room initialized', gameRoom.id);
      gameRoom = null;
    } else {
      ioServer.sockets.connected['/#' + user.socket].emit("waiting for opponent");
    }
  });

  socket.on("user click", function (room, userSocketID, col, row) {
    try {
      if (userSocketID ===
        gameRoomsPool[room].players[gameRoomsPool[room].currentPlayerMove].socket) {
        ioServer.sockets.connected['/#' + userSocketID].emit("opponent's turn");
        return;
      } else
      if (!gameRoomsPool[room].grid.get(row, col)) {
        gameRoomsPool[room].grid.set(row, col, userSocketID);
        gameRoomsPool[room].winner =
          result.check(gameRoomsPool[room].grid, col, row, userSocketID, room);


        ioServer.sockets.connected['/#' + gameRoomsPool[room].players[0].socket].emit(
          "grid update", col, row, userSocketID, JSON.stringify(
          gameRoomsPool[room].players));

        ioServer.sockets.connected['/#' + gameRoomsPool[room].players[1].socket].emit(
          "grid update", col, row, userSocketID, JSON.stringify(
            gameRoomsPool[room].players));


        if (gameRoomsPool[room].winner) {
          ioServer.sockets.connected['/#' + gameRoomsPool[room].players[0].socket].emit("winner", userSocketID);
          ioServer.sockets.connected['/#' + gameRoomsPool[room].players[1].socket].emit("winner", userSocketID);
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

