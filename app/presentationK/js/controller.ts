/*
kathi.kutschera@gmx.at
16.05.2016
*/

/// <reference path="../typings/socket.io-client/socket.io-client.d.ts" />

module ConnectFour {

  'use strict';

  interface myScope extends ng.IScope {
    testModus : boolean;
    start : boolean;
    play : boolean;
    name : string;
    startPlaying: () => void;
    showArrowDown : boolean[];
    // 0 frei; 1 ich; 2 der andere
    fields : number[][];
    drop: (column : number) => void;
    opponentDrop : (column : number, row : number) => void;
    popout: (column : number) => void;
    imageSources : string[];
    imgHeaderSources : string[];
    // 0 frei; 1 ich; 2 der andere
    header: number[];
    surrender : () => void;
    nameError : boolean;
    icons : {white : string, blue : string, red : string, blueArrowDown : string, redArrowDown : string};
    gameRoomID : number;
    thisPlayersTurn : (trueFalse : boolean) => void;
    user : {id : number, name : string, socket : string};
  }

  export class Controller {

    // What is used here also needs to be included in module.ts
    public static $inject : Array<string> = ["$scope"];

    // Params need to match $inject in number and type
    constructor (private $scope: myScope) {
      var webSocketHost = "http://localhost:8000";

      var socket = io.connect(webSocketHost);

      $scope.showArrowDown = [];

      for(let i = 0; i < 7; i++){
        $scope.showArrowDown[i] = true;
      }


      $scope.icons = {
        white : "../img/circleWhite.png",
        blue : "../img/circleBlue.png",
        red : "../img/circleRed.png",
        blueArrowDown : "../img/circleBlueArrowDown.png",
        redArrowDown : "../img/circleRedArrowDown.png"
      };

      $scope.imageSources = []
      $scope.imageSources[0] = $scope.icons.white;

      $scope.imgHeaderSources = [];
      $scope.header = [];


      $scope.fields = [];

      // index of column
      for(let i = 0; i < 7; i++){
        $scope.fields[i] = [];
        // index of row
        for(let j = 0; j < 6; j++){
          $scope.fields[i][j] = 0;
        }
      }


      $scope.start = true;
      $scope.play = false;


      $scope.drop = (column : number) => {
        console.log("Drop(" + column + ")");

        let col = $scope.fields[column];

        for(let row = 5; row >= 0; row--){
          // find first free space
          if(!col[row]){
            col[row] = 1;
            for(let i = 0; i < 7; i++){
              $scope.showArrowDown[i] = false;
            }
            socket.emit('user click', $scope.gameRoomID, $scope.user.id, column, row);
            break;
          }
        }
      }


      $scope.opponentDrop = (column : number, row : number) => {
        console.log("OpponentDrop(" + column + ")");

        let oppCol = $scope.fields[column];
        if(!oppCol[row]){
          oppCol[row] = 2;
          console.log("THIS opponentDrop: " + row);
        }
      }


      $scope.popout = (column : number) => {

      }

      $scope.thisPlayersTurn = (trueFalse : boolean) => {
        if(trueFalse === true){
          for(let i = 0; i < 7; i++){
            $scope.showArrowDown[i] = true;
            $scope.header[i] = 1;
          }
        } else {
          for(let i = 0; i < 7; i++){
            $scope.showArrowDown[i] = false;
          }
        }

      }

      $scope.surrender = () => {
        console.log("function surrender");
        socket.emit('leave room', $scope.gameRoomID, $scope.user.socket);
      }


      $scope.startPlaying = () => {
        if($scope.name != null){
          console.log("socket.id: " + socket.id);
          $scope.user = {id : null, name : $scope.name, socket : socket.id};
          console.log("User: " + $scope.user);

          socket.emit('new userName submit', $scope.user);

          socket.on('newUserName ack', function (ack) {
            var userAck = JSON.parse(ack);
            $scope.user.id = userAck.id;
            console.log("User ID ACK: " + userAck.id);
            console.log("User ID: " + $scope.user.id);
            console.log("User: " + JSON.stringify($scope.user));

            socket.emit('user will join room', $scope.user);

            if(($scope.user.id % 2) === 0){ // Player 1 Rot
              console.log("Player1")
              $scope.imageSources[1] = $scope.icons.red;
              $scope.imageSources[2] = $scope.icons.blue;

              $scope.imgHeaderSources[1] = $scope.icons.redArrowDown;
              $scope.imgHeaderSources[2] = $scope.icons.blueArrowDown;

            } else if(($scope.user.id % 2) === 1){ // Player 2 Blau
              console.log("Player2")
              $scope.imageSources[1] = $scope.icons.blue;
              $scope.imageSources[2] = $scope.icons.red;

              $scope.imgHeaderSources[1] = $scope.icons.blueArrowDown;
              $scope.imgHeaderSources[2] = $scope.icons.redArrowDown;
            }
          });
        }
      }

      socket.on('newUserName negative ack', function(name, socket){
        $scope.nameError = true;
      });

      socket.on('waiting for opponent', function(){
        console.log("Waiting for opponent");
      });

      socket.on('room initialized', function(roomID){
        console.log("ROOM INITIALIZED");
        $scope.gameRoomID = roomID;
        if($scope.user.id % 2 === 0){
          $scope.thisPlayersTurn(true);
        } else {
          $scope.thisPlayersTurn(false);
        }
        $scope.$apply(function(){
            $scope.play = true;
            $scope.start = false;
        });
      });

      socket.on('winner', function(userSocketID){
        if(userSocketID === $scope.user.socket){
          console.log("YOU WON!");
        } else {
          console.log("OTHER USER WON!");
        }
      });

      socket.on('opponent left', function(){
        console.log("OPPONENT LEFT!");
      });


      socket.on('grid update cell', function(col, row, userSocketID){
        if(userSocketID === $scope.user.socket){
          console.log("userSocketID: " + userSocketID);
          console.log("$scope.user.socket: " + $scope.user.socket);
          // do nothing
        } else {
          $scope.opponentDrop(col, row);
          console.log("grid update cell: " + row);
          // now it's time for this players move
          $scope.thisPlayersTurn(true);
        }
      });

    }

  }

angular.module('ConnectFour').controller('controller', Controller);

}
