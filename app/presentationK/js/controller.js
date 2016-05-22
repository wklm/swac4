var ConnectFour;
(function (ConnectFour) {
    'use strict';
    var Controller = (function () {
        function Controller($scope) {
            this.$scope = $scope;
            var webSocketHost = "http://localhost:8000";
            var socket = io.connect(webSocketHost);
            $scope.showArrowDown = [];
            for (var i = 0; i < 7; i++) {
                $scope.showArrowDown[i] = true;
            }
            $scope.icons = {
                white: "../img/circleWhite.png",
                blue: "../img/circleBlue.png",
                red: "../img/circleRed.png",
                blueArrowDown: "../img/circleBlueArrowDown.png",
                redArrowDown: "../img/circleRedArrowDown.png"
            };
            $scope.imageSources = [];
            $scope.imageSources[0] = $scope.icons.white;
            $scope.imgHeaderSources = [];
            $scope.header = [];
            $scope.fields = [];
            for (var i = 0; i < 7; i++) {
                $scope.fields[i] = [];
                for (var j = 0; j < 6; j++) {
                    $scope.fields[i][j] = 0;
                }
            }
            $scope.start = true;
            $scope.play = false;
            $scope.drop = function (column) {
                console.log("Drop(" + column + ")");
                var col = $scope.fields[column];
                for (var row = 5; row >= 0; row--) {
                    if (!col[row]) {
                        col[row] = 1;
                        socket.emit('user click', $scope.gameRoomID, $scope.user.id, column, row);
                        $scope.thisPlayersTurn(false);
                        break;
                    }
                }
            };
            $scope.opponentDrop = function (column, row) {
                console.log("OpponentDrop(" + column + ")");
                var oppCol = $scope.fields[column];
                if (!oppCol[row]) {
                    oppCol[row] = 2;
                    console.log("THIS opponentDrop: " + row);
                }
                $scope.thisPlayersTurn(true);
                $scope.safeApply();
            };
            $scope.popout = function (column) {
            };
            $scope.thisPlayersTurn = function (trueFalse) {
                for (var i = 0; i < 7; i++) {
                    $scope.showArrowDown[i] = trueFalse;
                    $scope.header[i] = 1;
                }
                console.log("$scope.showArrowDown" + JSON.stringify($scope.showArrowDown));
            };
            $scope.surrender = function () {
                console.log("function surrender");
                socket.emit('leave room', $scope.gameRoomID, $scope.user.socket);
            };
            $scope.startPlaying = function () {
                if ($scope.name != null) {
                    console.log("socket.id: " + socket.id);
                    $scope.user = { id: null, name: $scope.name, socket: socket.id };
                    console.log("User: " + $scope.user);
                    socket.emit('new userName submit', $scope.user);
                }
            };
            socket.on('newUserName ack', function (ack) {
                var userAck = JSON.parse(ack);
                $scope.user.id = userAck.id;
                console.log("User ID ACK: " + userAck.id);
                console.log("User ID: " + $scope.user.id);
                console.log("User: " + JSON.stringify($scope.user));
                socket.emit('user will join room', $scope.user);
                if (($scope.user.id % 2) === 0) {
                    console.log("Player1");
                    $scope.imageSources[1] = $scope.icons.red;
                    $scope.imageSources[2] = $scope.icons.blue;
                    $scope.imgHeaderSources[1] = $scope.icons.redArrowDown;
                    $scope.imgHeaderSources[2] = $scope.icons.blueArrowDown;
                }
                else if (($scope.user.id % 2) === 1) {
                    console.log("Player2");
                    $scope.imageSources[1] = $scope.icons.blue;
                    $scope.imageSources[2] = $scope.icons.red;
                    $scope.imgHeaderSources[1] = $scope.icons.blueArrowDown;
                    $scope.imgHeaderSources[2] = $scope.icons.redArrowDown;
                }
            });
            socket.on('newUserName negative ack', function (name, socket) {
                $scope.nameError = true;
            });
            socket.on('waiting for opponent', function () {
                console.log("Waiting for opponent");
            });
            socket.on('room initialized', function (roomID) {
                console.log("ROOM INITIALIZED");
                $scope.gameRoomID = roomID;
                console.log("$scope.user.id % 2 === 0:" + ($scope.user.id % 2 === 0));
                $scope.thisPlayersTurn($scope.user.id % 2 === 0);
                $scope.play = true;
                $scope.start = false;
                $scope.safeApply();
            });
            socket.on('winner', function (userSocketID) {
                if (userSocketID === $scope.user.id) {
                    console.log("YOU WON!");
                }
                else {
                    console.log("OTHER USER WON!");
                }
            });
            socket.on('opponent left', function () {
                console.log("OPPONENT LEFT!");
            });
            socket.on('grid update cell', function (col, row, userSocketID) {
                console.log("userSocketID: " + userSocketID);
                console.log("$scope.user.socket: " + $scope.user.socket);
                if (userSocketID === $scope.user.id) {
                }
                else {
                    $scope.opponentDrop(col, row);
                    console.log("grid update cell: " + row);
                }
            });
            $scope.safeApply = function () {
                var phase = $scope.$root.$$phase;
                if (phase == '$apply' || phase == '$digest')
                    $scope.$eval();
                else
                    $scope.$apply();
            };
        }
        Controller.$inject = ["$scope"];
        return Controller;
    }());
    ConnectFour.Controller = Controller;
    angular.module('ConnectFour').controller('controller', Controller);
})(ConnectFour || (ConnectFour = {}));
//# sourceMappingURL=controller.js.map