"use strict";
var socket = io.connect('http://localhost:8000');
var Cell = React.createClass({
  getInitialState: function () {
    return {
      occupied: false
    }
  },

  clickHandler: function (row, col) {
    console.log("clicked column: " + col + ", row: " + row);
    this.setState({
      occupied: true
    });
    socket.emit('user click', this.props.currentRoom, this.props.userID, col, row); // make move
  },

  render: function () {
    return this.state.occupied ? (
      <div
        className="cell"
        onClick={() =>
          this.clickHandler(this.props.x, this.props.y)}>
        O
      </div>
    ) : (
      <div
        className="cell"
        onClick={() =>
          this.clickHandler(this.props.x, this.props.y)}>
        X
      </div>
    )
  }
})

var Column = React.createClass({
  getInitialState() {
    return {
      occupied: null
    }
  },
  render: function () {
    let cells = this.props.row.x.map(x => {
      return (
        <div
          key={Math.random()}
        >
          <Cell
            x={x}
            y={this.props.row.y}
            currentRoom={this.props.currentRoom}
            userID={this.props.userID}
          />
        </div>
      )
    })

    return (
      <div className="table-column">
        {cells}
      </div>
    )
  }
});


var Grid = React.createClass({
  getInitialState: function () {
    return {
      matrix: new Array()
    }
  },

  componentWillMount: function () {
    for (let i = 0; i < 7;) { // columns
      this.state.matrix[i] = {
        x: Array.apply(null, {length: 6}).map(Number.call, Number), // rows
        y: i++
      }
    }
  },

  render: function () {
    let rows = this.state.matrix.map(row => {
      return (
        <tr key={row.y} className="small-1 columns left">
          <Column
            row={row}
            currentRoom={this.props.currentRoom}
            userID={this.props.userID}
          />
        </tr>
      )
    })
    return (
      <table className="grid row">
        {rows}
      </table>
    )
  }
});

var WelcomeScreen = React.createClass({
  getInitialState: function () {
    return {name: ''};
  },

  handleNameChange: function (e) {
    this.setState({name: e.target.value});
  },

  handleSubmit: function (e) {
    e.preventDefault();
    var name = this.state.name.trim();
    if (!name) return;
    this.props.setUserName({name: name});
    this.setState({name: ''});
  },

  render: function () {
    return (
      <div className="row">
        <form className="small-12 columns" onSubmit={this.handleSubmit}>
          <input
            type="text"
            placeholder="hey, what's your name?"
            value={this.state.name}
            onChange={this.handleNameChange}
          />
          <input type="submit" value="let's play"/>
        </form>
      </div>
    );
  }
});

var Root = React.createClass({
  getInitialState: function () {
    return {
      userName: null,
      userID: null,
      acknowledged: false,
      currentGameRoom: null
    }
  },

  componentWillMount: function () { // messages handler started on app load
    socket.on('newUserName ack', (ack) => // userName accepted
      this.nameAckHandler(JSON.parse(ack))
    );

    socket.on('room initialized', (roomID) =>
      this.connectToGameRoom(roomID)
    );
  },

  nameAckHandler: function (ack) {
    this.setState({
      acknowledged: true,
      userID: ack.id,
    });
    ack.socket = socket.id;
    let user = ack;
    socket.emit('user will join room', user)
  },

  connectToGameRoom: function (roomID) {
    console.log("doszlo cos");
    this.setState({
      currentGameRoom: roomID
    });
  },

  handleNewUserArrival: function (name) {
    this.setState({
      userName: name
    })
    socket.emit('new userName submit', name);
  },

  render: function () {
    return this.state.userName ? (
      <Loader loaded={this.state.acknowledged && this.state.currentGameRoom != null}>
        <Grid
          userName={this.state.userName}
          userID={this.state.userID}
          currentRoom={this.state.currentGameRoom}
        />
      </Loader>
    ) : (
      <WelcomeScreen setUserName={this.handleNewUserArrival}/>
    )
  }
});

ReactDOM.render(
  <Root />,
  document.getElementById('react')
);


