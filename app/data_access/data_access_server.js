var path = require('path');
var express = require('express');
var http = require('http');
var app = express();
var server = app.listen(9000);
var io = require('socket.io').listen(server);
var f2dA = require('fixed-2d-array');

var connection = false;

io.on('connection', function (socket) {
  if (!connection) { // singleton to prevent multiple DAS instances
    connection = true;
    var usersQueue = {}
    console.log('DAS: BLS connected');
  }
  else {
    console.log("multiple co")
  }
});

app.listen(app.get('port'), function () {
  console.log('Data Access Server started: localhost:9000');
});
