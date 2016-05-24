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
    icons : {white : string, blue : string, red : string, blueArrowDown : string, redArrowDown : string, redArrowDownLg : string, blueArrowDownLg : string};
    gameRoomID : number;
    thisPlayersTurn : (trueFalse : boolean) => void;
    user : {id : number, name : string, socket : string};
    safeApply : () => void;
    success : boolean;
    failure : boolean;
    messageInfo : {turn : string, info : string};
    variants : string[];
    selectedVariant : string;
    waiting : boolean;
  }

  export class Controller {

    // What is used here also needs to be included in module.ts
    public static $inject : Array<string> = ["$scope"];

    // Params need to match $inject in number and type
    constructor (private $scope: myScope) {
      var webSocketHost = "http://localhost:8000";

      var socket = io.connect(webSocketHost);


      // set possible variants and default variant
      $scope.variants = [];
      $scope.variants[0] = "Standard";
      $scope.variants[1] = "Popout";

      $scope.selectedVariant = "Standard";


      // set paths to icons
      $scope.icons = {
        white : "../img/circleWhite.png",
        blue : "../img/circleBlue.png",
        red : "../img/circleRed.png",
        blueArrowDown : "../img/circleBlueArrowDown.png",
        redArrowDown : "../img/circleRedArrowDown.png",
        blueArrowDownLg : "../img/circleBlueArrowDownLg.png",
        redArrowDownLg : "../img/circleRedArrowDownLg.png"
      };

      $scope.imageSources = []
      $scope.imageSources[0] = $scope.icons.white;

      $scope.imgHeaderSources = [];
      $scope.header = [];

      $scope.showArrowDown = [];


      $scope.fields = [];

      // index of column
      for(let i = 0; i < 7; i++){
        $scope.fields[i] = [];
        // index of row
        for(let j = 0; j < 6; j++){
          $scope.fields[i][j] = 0;
        }
      }

      // start Settings
      $scope.start = true;
      $scope.play = false;
      $scope.success = false;
      $scope.failure = false;

      // drop Method
      $scope.drop = (column : number) => {
        console.log("Drop(" + column + ")");

        let col = $scope.fields[column];

        for(let row = 5; row >= 0; row--){
          // find first free space
          if(!col[row]){
            col[row] = 1;
            socket.emit('user click', $scope.gameRoomID, $scope.user.id, column, row);
            $scope.thisPlayersTurn(false);
            break;
          }
        }
      }

      // drop Method for opponents drop
      $scope.opponentDrop = (column : number, row : number) => {
        console.log("OpponentDrop(" + column + ")");

        let oppCol = $scope.fields[column];
        if(!oppCol[row]){
          oppCol[row] = 2;
          console.log("THIS opponentDrop: " + row);
        }
        $scope.thisPlayersTurn(true);
        $scope.safeApply();
      }

      // popout drop Method
      $scope.popout = (column : number) => {
        console.log("POPOUT: " + column);
        let popCol = $scope.fields[column];
        if(popCol[5] === 3){
          popCol[5] = popCol[4];
          popCol[4] = popCol[3];
          popCol[3] = popCol[2];
          popCol[2] = popCol[1];
          popCol[1] = popCol[0];
          popCol[0] = 0;
          $scope.thisPlayersTurn(false);
          $scope.safeApply();
        }
      }

      // Settings depending on which players turn it is
      $scope.thisPlayersTurn = (trueFalse : boolean) => {
        for(let i = 0; i < 7; i++){
          $scope.showArrowDown[i] = trueFalse;
          if(0 != $scope.fields[i][0]){
            $scope.showArrowDown[i] = false;
          }
          if(trueFalse && "Popout" === $scope.selectedVariant && 1 === $scope.fields[i][5]){
            $scope.fields[i][5] = 3;
          }
          $scope.header[i] = 1;
        }
        if(trueFalse){
          $scope.messageInfo = {turn : "Your turn!", info : "Please choose a row."};
        } else {
          $scope.messageInfo = {turn : "Your opponents turn!", info : "Please wait until it's your turn."};
        }
        console.log("$scope.showArrowDown" + JSON.stringify($scope.showArrowDown));

      }

      // surrender Method
      $scope.surrender = () => {
        console.log("function surrender");
        socket.emit('leave room', $scope.gameRoomID, $scope.user.socket);
      }


      // send user name, choosen variant and socketID to Business Logic Layer
      $scope.startPlaying = () => {
        if($scope.name != null){
          console.log("socket.id: " + socket.id);
          // variant
          $scope.user = {id : null, name : $scope.name, socket : socket.id};
          console.log("User: " + JSON.stringify($scope.user));
          console.log("Variant: " + $scope.selectedVariant);
          socket.emit('new userName submit', $scope.user);
        }
      }


      // acknowledgement for user name
      socket.on('newUserName ack', (ack) => {
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
          $scope.imageSources[3] = $scope.icons.redArrowDownLg;

          $scope.imgHeaderSources[1] = $scope.icons.redArrowDown;
          $scope.imgHeaderSources[2] = $scope.icons.blueArrowDown;

        } else if(($scope.user.id % 2) === 1){ // Player 2 Blau
          console.log("Player2")
          $scope.imageSources[1] = $scope.icons.blue;
          $scope.imageSources[2] = $scope.icons.red;
          $scope.imageSources[3] = $scope.icons.blueArrowDownLg;

          $scope.imgHeaderSources[1] = $scope.icons.blueArrowDown;
          $scope.imgHeaderSources[2] = $scope.icons.redArrowDown;
        }
      });


      // negative acknowledgement for user name
      socket.on('newUserName negative ack', (name, socket) => {
        $scope.nameError = true;
        console.log("NEGATIVE ACKNOWLEDGEMENT: " + name);
        $scope.safeApply();
      });


      // waiting for opponent
      socket.on('waiting for opponent', () => {
        $scope.start = false;
        $scope.waiting = true;
        $scope.safeApply();
        console.log("Waiting for opponent");
      });


      // room initialized - start of Game
      socket.on('room initialized', (roomID) => {
        console.log("ROOM INITIALIZED");
        $scope.gameRoomID = roomID;
        console.log("$scope.user.id % 2 === 0:" + ($scope.user.id % 2 === 0));
        $scope.thisPlayersTurn($scope.user.id % 2 === 0);
        $scope.waiting = false;
        $scope.start = false;
        $scope.play = true;
        $scope.safeApply();
      });


      // info if someone has won
      socket.on('winner', (userSocketID) => {
        if(userSocketID === $scope.user.id){
          console.log("YOU WON!");
          $scope.success = true;
          $scope.thisPlayersTurn(false);
        } else {
          console.log("OTHER USER WON!");
          $scope.failure = true;
          $scope.thisPlayersTurn(false);
        }
        $scope.safeApply();
      });


      // info if opponent has left the game (surrender)
      socket.on('opponent left', () => {
        console.log("OPPONENT LEFT!");
      });


      // infos related to someones turn
      socket.on('grid update cell', (col, row, userSocketID) => {
        console.log("userSocketID: " + userSocketID);
        console.log("$scope.user.socket: " + $scope.user.socket);
        if(userSocketID === $scope.user.id){
          // do nothing, already done
        } else {
          $scope.opponentDrop(col, row);
          console.log("grid update cell: " + row);
        }
      });


      // Method for a safe apply - update of html page
      $scope.safeApply = () => {
        var phase = $scope.$root.$$phase;
        if (phase == '$apply' || phase == '$digest')
            $scope.$eval();
        else
            $scope.$apply();
      }


    }


  }

angular.module('ConnectFour').controller('controller', Controller);

}
