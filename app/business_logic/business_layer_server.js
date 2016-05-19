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

  socket.on('user will join room', function (user) { // variant may be 'standard' or 'popout'
    activeUserPool.push(user);
    if (user.id % 2) {
      let gameRoom = {
        players: activeUserPool.slice(-2),
        id: currentRoomID++,
        grid: new f2dA(7, 7, null),
        currentPlayerMove: 1,
        winner: null,
        gameVariant: null
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
    const r = gameRoomsPool[room],
      playersStr = JSON.stringify(r.players), rSockets = ioServer.sockets.connected,
      pSocIDs = ['/#' + r.players[0].socket, '/#' + r.players[1].socket];
    try {
      if (!gameRoomsPool[room].gameVariant) {throw "no game variant selected";}
      if (userSocketID === r.players[r.currentPlayerMove].socket) {throw("opponent's turn");}
      if (r.grid.get(row, col)) {throw "cell already occupied";}

      r.grid.set(row, col, userSocketID);
      r.winner = result.check(r.grid, col, row, userSocketID, room);

      rSockets['/#' + r.players[0].socket].emit("grid update", col, row, userSocketID, playersStr);
      rSockets['/#' + r.players[1].socket].emit("grid update", col, row, userSocketID, playersStr);

      if (r.winner) {
        rSockets[pSocIDs[0]].emit("winner", userSocketID);
        rSockets[pSocIDs[1]].emit("winner", userSocketID);
      }
      r.currentPlayerMove = +!r.currentPlayerMove;
    } catch (boardClickErr) {
      console.error(boardClickErr);
      rSockets['/#' + userSocketID].emit("board click error", boardClickErr);
    }
  });
  socket.on('leave room', function (room, userSocketID) { // leave the room
    const r = gameRoomsPool[room], rSockets = ioServer.sockets.connected;
    let opponent = userSocketID === r.players[0].socket ? r.players[1].socket : userSocketID;
    rSockets['/#' + opponent].emit("opponent left");
    rSockets['/#' + userSocketID].disconnect();
  });
});
app.listen(app.get('port'), function () {
  console.log('Business Layer Server started: localhost:8000');
});

