var path = require('path');
var express = require('express');
var http = require('http');
var app = express();
var server = app.listen(8000);
var io = require('socket.io').listen(server);
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

io.on('connection', function(socket){
    console.log('a user connected');
});

app.listen(app.get('port'), function () {
    console.log('Business Layer Server started: localhost:8000');
});
