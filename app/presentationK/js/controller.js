var ConnectFour;
(function (ConnectFour) {
    'use strict';
    var Controller = (function () {
        function Controller($scope) {
            this.$scope = $scope;
            var webSocketHost = "http://localhost:8000";
            var socket = io.connect(webSocketHost);
            $scope.variants = [];
            $scope.variants[0] = "Standard";
            $scope.variants[1] = "Popout";
            $scope.selectedVariant = "Standard";
            $scope.icons = {
                white: "../img/circleWhite.png",
                blue: "../img/circleBlue.png",
                red: "../img/circleRed.png",
                blueArrowDown: "../img/circleBlueArrowDown.png",
                redArrowDown: "../img/circleRedArrowDown.png",
                blueArrowDownLg: "../img/circleBlueArrowDownLg.png",
                redArrowDownLg: "../img/circleRedArrowDownLg.png"
            };
            $scope.imageSources = [];
            $scope.imageSources[0] = $scope.icons.white;
            $scope.imgHeaderSources = [];
            $scope.header = [];
            $scope.showArrowDown = [];
            $scope.fields = [];
            for (var i = 0; i < 7; i++) {
                $scope.fields[i] = [];
                for (var j = 0; j < 6; j++) {
                    $scope.fields[i][j] = 0;
                }
            }
            $scope.start = true;
            $scope.play = false;
            $scope.success = false;
            $scope.failure = false;
            $scope.opponentLeft = false;
            $scope.youGaveUp = false;
            $scope.drop = function (column) {
                console.log("Drop(" + column + ")");
                var col = $scope.fields[column];
                for (var row = 5; row >= 0; row--) {
                    if (!col[row]) {
                        col[row] = 1;
                        socket.emit('user click', $scope.gameRoomID, $scope.user.socket, column, row);
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
                console.log("POPOUT: " + column);
                var popCol = $scope.fields[column];
                if (popCol[5] === 3) {
                    popCol[5] = popCol[4];
                    popCol[4] = popCol[3];
                    popCol[3] = popCol[2];
                    popCol[2] = popCol[1];
                    popCol[1] = popCol[0];
                    popCol[0] = 0;
                    socket.emit('user click', $scope.gameRoomID, $scope.user.socket, column, 5);
                    $scope.thisPlayersTurn(false);
                    $scope.safeApply();
                }
            };
            $scope.opponentPopout = function (column) {
                console.log("OPPONENT POPOUT: " + column);
                var oppPopCol = $scope.fields[column];
                if (oppPopCol[5] === 2) {
                    oppPopCol[5] = oppPopCol[4];
                    oppPopCol[4] = oppPopCol[3];
                    oppPopCol[3] = oppPopCol[2];
                    oppPopCol[2] = oppPopCol[1];
                    oppPopCol[1] = oppPopCol[0];
                    oppPopCol[0] = 0;
                    $scope.thisPlayersTurn(true);
                    $scope.safeApply();
                }
            };
            $scope.thisPlayersTurn = function (trueFalse) {
                for (var i = 0; i < 7; i++) {
                    $scope.showArrowDown[i] = trueFalse;
                    if (0 != $scope.fields[i][0]) {
                        $scope.showArrowDown[i] = false;
                    }
                    if (trueFalse && "Popout" === $scope.gameVariant && 1 === $scope.fields[i][5]) {
                        $scope.fields[i][5] = 3;
                    }
                    if (!trueFalse && "Popout" === $scope.gameVariant && 3 === $scope.fields[i][5]) {
                        $scope.fields[i][5] = 1;
                    }
                    $scope.header[i] = 1;
                }
                if (trueFalse) {
                    $scope.messageInfo = { turn: "Your turn!", info: "Please choose a row." };
                }
                else {
                    $scope.messageInfo = { turn: "Your opponents turn!", info: "Please wait until it's your turn." };
                }
                console.log("$scope.showArrowDown" + JSON.stringify($scope.showArrowDown));
            };
            $scope.surrender = function () {
                console.log("function surrender");
                $scope.thisPlayersTurn(false);
                $scope.youGaveUp = true;
                socket.emit('leave room', $scope.gameRoomID, $scope.user.socket);
            };
            $scope.startPlaying = function () {
                if ($scope.name != null) {
                    console.log("socket.id: " + socket.id);
                    $scope.user = { id: null, name: $scope.name, socket: socket.id, chosenVariant: $scope.selectedVariant };
                    console.log("User: " + JSON.stringify($scope.user));
                    console.log("Variant: " + $scope.selectedVariant);
                    socket.emit('new userName submit', $scope.user, $scope.selectedVariant);
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
                    $scope.imageSources[3] = $scope.icons.redArrowDownLg;
                    $scope.imgHeaderSources[1] = $scope.icons.redArrowDown;
                    $scope.imgHeaderSources[2] = $scope.icons.blueArrowDown;
                }
                else if (($scope.user.id % 2) === 1) {
                    console.log("Player2");
                    $scope.imageSources[1] = $scope.icons.blue;
                    $scope.imageSources[2] = $scope.icons.red;
                    $scope.imageSources[3] = $scope.icons.blueArrowDownLg;
                    $scope.imgHeaderSources[1] = $scope.icons.blueArrowDown;
                    $scope.imgHeaderSources[2] = $scope.icons.redArrowDown;
                }
            });
            socket.on('newUserName negative ack', function (name, socket) {
                $scope.nameError = true;
                console.log("NEGATIVE ACKNOWLEDGEMENT: " + name);
                $scope.safeApply();
            });
            socket.on('waiting for opponent', function () {
                $scope.start = false;
                $scope.waiting = true;
                $scope.safeApply();
                console.log("Waiting for opponent");
            });
            socket.on('room initialized', function (roomID, gameVariant) {
                console.log("ROOM INITIALIZED");
                $scope.gameRoomID = roomID;
                $scope.gameVariant = gameVariant;
                console.log("gameVariant: " + gameVariant);
                console.log("$scope.gameVariant: " + $scope.gameVariant);
                console.log("$scope.user.id % 2 === 0:" + ($scope.user.id % 2 === 0));
                $scope.thisPlayersTurn($scope.user.id % 2 === 0);
                $scope.waiting = false;
                $scope.start = false;
                $scope.play = true;
                $scope.safeApply();
            });
            socket.on('winner', function (userSocketID) {
                if (userSocketID === $scope.user.socket) {
                    console.log("YOU WON!");
                    $scope.success = true;
                    $scope.thisPlayersTurn(false);
                }
                else {
                    console.log("OTHER USER WON!");
                    $scope.failure = true;
                    $scope.thisPlayersTurn(false);
                }
                $scope.safeApply();
            });
            socket.on('opponent left', function () {
                console.log("OPPONENT LEFT!");
                $scope.opponentLeft = true;
                $scope.thisPlayersTurn(false);
                $scope.safeApply();
            });
            socket.on('grid update cell', function (col, row, userSocketID) {
                console.log("userSocketID: " + userSocketID);
                console.log("$scope.user.socket: " + $scope.user.socket);
                if (userSocketID === $scope.user.socket) {
                    console.log("own drop");
                }
                else {
                    $scope.opponentDrop(col, row);
                    console.log("grid update cell: " + row);
                }
            });
            socket.on('grid update all', function (col, userSocketID) {
                console.log("opponent Popout");
                if (userSocketID === $scope.user.socket) {
                    console.log("own popout");
                }
                else {
                    $scope.opponentPopout(col);
                    console.log("opponent popout");
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