/**
 * Created by wojtek on 17.05.16.
 */
"use strict";
var BL = module.exports = {};
var _ = require('lodash');


BL.check = function (matrix, col, row, userSocketID) {
  return (_.isEqual(_.dropWhile(_.dropRightWhile(matrix.getRow(row), (c) => {
    return c !== userSocketID
  }), (c) => {
    return c !== userSocketID
  }), new Array(4).fill(userSocketID))) || (_.isEqual(_.dropWhile(_.dropRightWhile(matrix.getColumn(col), (c) => {
    return c !== userSocketID
  }), (c) => {
    return c !== userSocketID
  }), new Array(4).fill(userSocketID))) || checkDiagonal(matrix, col, row, userSocketID) ? userSocketID : null;
};

function checkDiagonal(matrix, col, row, userSocketID) {
  let bCol = col > row ? col - row : 0,
    bRow = col < row ? row - col : 0,
    bArray = [], eArray = [];
  try {
    while (matrix.getColumn(++col), matrix.getRow(--row)) continue
  } catch (outOfRange) {
    try {
      if (--col < matrix.getHeight() - 1) {
        ++row
      }
      while (matrix.getColumn(col) && matrix.getRow(row)) {
        eArray.push(matrix.get(row, col));
        matrix.validateCoords(--col, ++row);
      }
    } catch (outOfRange) {
      if (eArray.filter(function (value) {
          return value === userSocketID
        }).length === 4) {
        return true;
      }
    }
  }
  try {
    while (matrix.getColumn(bCol) && matrix.getRow(bRow)) {
      bArray.push(matrix.get(bRow, bCol));
      matrix.validateCoords(bRow++, bCol++);
    }
  } catch (outOfRange) {
    if (bArray.filter(function (value) {
        return value === userSocketID
      }).length === 4) {
      return true;
    }
  }
  return false;
}