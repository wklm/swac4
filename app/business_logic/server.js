var path = require('path');
var express = require('express');
var http = require('http');
var app = express();
var server = app.listen(8000);
var io = require('socket.io').listen(server);


app.use('/', express.static(path.join(__dirname, '../presentation')));



app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    next();
});

io.on('connection', function(socket){
    console.log('a user connected');
});
