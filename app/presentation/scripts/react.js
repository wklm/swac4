"use strict";
//var socket = io.connect('localhost:3000' );

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
  },

  render: function () {
    return this.state.occupied ? (
      <div onClick={() =>
       this.clickHandler(this.props.x, this.props.y)}>
        O
      </div>
    ) : (
      <div onClick={() =>
       this.clickHandler(this.props.x, this.props.y)}>
        X
      </div>
    )
  }
})

var Row = React.createClass({
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
          />
        </div>
      )
    })

    return (
      <div>
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
        <td key={row.y}>
          <Row row={row}/>
        </td>
      )
    })
    return (
      <table className="grid">
        {rows}
      </table>
    )
  }
});


var Root = React.createClass({
  getInitialState: function () {
    return {}
  },
  render: function () {
    return (
      <Grid />
    )
  }
});

ReactDOM.render(
  <Root />,
  document.getElementById('react')
);


