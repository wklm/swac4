"use strict";
//var socket = io.connect('localhost:3000' );

var Row = React.createClass({
  trigger: function(col, row) {
    console.log("clicked column: " + col + ", row: " + row );
  },
  render: function () {


    let cells = this.props.row.x.map(cell => {
      return (
        <div
          key={Math.random()}
          onClick={() => this.trigger(this.props.row.y, cell)}
        >
          {cell}
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
        x:  Array.apply(null, {length: 6}).map(Number.call, Number), // rows
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
      <table>
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


