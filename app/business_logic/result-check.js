/**
 * Created by wojtek on 17.05.16.
 */
"use strict";
var BL = module.exports = {};

BL.check = function (matrix, col, row, userSocketID) {
  let rowIndexArr = [], colIndexArr = [];
  if ((matrix.getRow(row).filter(function (value) {
      return value === userSocketID
    }).length === 4) || (
    matrix.getColumn(col).filter(function (value) {
      return value === userSocketID
    }).length === 4)) {
    for (let i in matrix.getRow(row)) {
      if (matrix.getRow(row)[i] === userSocketID) {
        rowIndexArr.push(i)
      }
    }
    for (let i in matrix.getColumn(col)) {
      if (matrix.getColumn(col)[i] === userSocketID) {
        colIndexArr.push(i)
      }
    }
    if ((rowIndexArr[3] - rowIndexArr[0] === 3) ||
      colIndexArr[3] - colIndexArr[0] === 3) {
      return userSocketID;
    }
  }
  if (checkDiagonal(matrix, col, row, userSocketID)) {
    return userSocketID;
  }
  return null;
}

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
