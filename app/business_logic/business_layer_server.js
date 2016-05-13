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

var matrix = f2dA(7,6,null);


app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    next();
});

ioServer.on('connection', function(socket){
    console.log('BLS: user connected ');
    ioClient.connect('http://localhost:9000');
});

app.listen(app.get('port'), function () {
    console.log('Business Layer Server started: localhost:8000');
});
