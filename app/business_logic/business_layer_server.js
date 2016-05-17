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
        grid: new f2dA(7, 7, null),
        currentPlayerMove: null,
        winner: null
      } // 7x7 size hack because of lib bug
      gameRoomsPool.push(gameRoom);
      ioServer.sockets.emit("room initialized", gameRoom.id);
      gameRoom = null;
    } else {
      socket.to(user.socket).emit("waiting for opponent");
    }
  });
  socket.on("user click", function (room, userSocketID, col, row) {
    try {
      if (!gameRoomsPool[room].grid.get(row, col)) {
        gameRoomsPool[room].grid.set(row, col, userSocketID);
        gameRoomsPool[room].winner =
          checkResult(gameRoomsPool[room].grid, col, row, userSocketID, room);

        ioServer.sockets.emit("grid update", col, row, userSocketID, room);

        if (gameRoomsPool[room].winner) {
          ioServer.sockets.emit("winner", userSocketID, room);
        }
      }
    } catch (e) {
      console.error(e);
    }
  });
});

app.listen(app.get('port'), function () {
  console.log('Business Layer Server started: localhost:8000');
});


function checkResult(matrix, col, row, userSocketID, room) {
  let rowIndexArr = [], colIndexArr = [];

  if ((matrix.getRow(row).filter(function (value) {
      return value === userSocketID
    }).length === 4) || (
    matrix.getColumn(col).filter(function (value) {
      return value === userSocketID
    }).length === 4)) {
    for (let i in matrix.getRow(row)) {
      if (matrix.getRow(row)[i] === userSocketID) {
        rowIndexArr.push(i)
      }
    }
    for (let i in matrix.getColumn(col)) {
      if (matrix.getColumn(col)[i] === userSocketID) {
        colIndexArr.push(i)
      }
    }
    if ((rowIndexArr[3] - rowIndexArr[0] === 3) ||
      colIndexArr[3] - colIndexArr[0] === 3) {
      return userSocketID;
    }
  }
  if (checkDiagonal(gameRoomsPool[room].grid, col, row, userSocketID)) {
    return userSocketID;
  };
  return null;
}


function checkDiagonal(matrix, col, row, userSocketID) {
  let resultArray = [];
  let bCol = 0, bRow = 0;
  if (col > row) {
    bCol = col - row;
  } else if (col < row) {
    bRow = row - col;
  }
  try {
    while (matrix.getColumn(bCol) && matrix.getRow(bRow)) {
      resultArray.push(matrix.get(bRow, bCol));
      matrix.validateCoords(bRow++, bCol++);
    }
  } catch (outOfRange) {
    if (resultArray.filter(function (value) {
        return value === userSocketID
      }).length === 4) {
      return true;
    }
  }
  return false;
}