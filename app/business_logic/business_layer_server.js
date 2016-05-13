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

ioServer.on('connection', function (socket) {
  console.log('BLS: user connected ');
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
});

app.listen(app.get('port'), function () {
  console.log('Business Layer Server started: localhost:8000');
});
