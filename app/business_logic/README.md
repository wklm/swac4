#Socket messages:

<br/>
##outgoing:


<center>

| message        | arguments           | description   
| ------------- |:------------------------:| --:| 
| newUserName ack     | ack  |   provided userName is available 
| newUserName negative ack | name, socket.id     |   provided userName is unavailable 
|room initialized | gameRoom.id | triggered on successful room initialization (2 players assigned and game variant chosen)
|waiting for opponent| |waiting for another player to initialize the game room 
|grid update cell | col, row, userSocketID | assign userSocketID value to cell (col, row)
|grid update all| r.grid | update the whole grid, triggered after pop-out
|winner| userSocketID | triggered when player wins to notify game members
|board click error |1. opponent's turn <br /> 2. can't popout element, <br />3. wrong game variant |  1. triggered on click in opponent's turn, <br /> 2. can't popout element, <br /> 3. game variant should be 'standard' or 'popout', triggered on invalid variant's name or when variant is not defined

</center>
<br/>

## incoming:
<center>

| message        | arguments           | description   
| ------------- |:-------------:| -----:| 
| new userName submit      | user | user inputs username 
| user will join room      | user | user joins a new game room  |
| user click     | room, userSocketID, col, row      |  user clicks a field on game board |
| leave room | room, userSocketID      |  user leaves room |

</center>