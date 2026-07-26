// SHARED — mock tối thiểu cho SpreadsheetApp, dùng để test logic Code.gs bằng Node
// trước khi deploy lên Google thật. Chỉ mô phỏng đúng method mà Backend Core Library dùng.

class MockRange {
  constructor(sheet, row, col, numRows, numCols) {
    this.sheet = sheet; this.row = row; this.col = col; this.numRows = numRows; this.numCols = numCols;
  }
  getValues() {
    const out = [];
    for (let r = 0; r < this.numRows; r++) {
      const rowData = this.sheet.rows[this.row - 1 + r] || [];
      const line = [];
      for (let c = 0; c < this.numCols; c++) line.push(rowData[this.col - 1 + c] !== undefined ? rowData[this.col - 1 + c] : '');
      out.push(line);
    }
    return out;
  }
  setValues(values) {
    values.forEach((line, r) => {
      const rowIdx = this.row - 1 + r;
      while (this.sheet.rows.length <= rowIdx) this.sheet.rows.push([]);
      line.forEach((v, c) => { this.sheet.rows[rowIdx][this.col - 1 + c] = v; });
    });
  }
  setValue(v) { this.setValues([[v]]); }
}

class MockSheet {
  constructor(name) { this.name = name; this.rows = []; }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return this.rows[0] ? this.rows[0].length : 0; }
  getRange(row, col, numRows, numCols) { return new MockRange(this, row, col, numRows || 1, numCols || 1); }
  getDataRange() { return this.getRange(1, 1, this.rows.length, this.getLastColumn()); }
  appendRow(arr) { this.rows.push(arr.slice()); }
  setFrozenRows() {}
}

class MockSpreadsheet {
  constructor() { this.sheets = {}; }
  getSheetByName(name) { return this.sheets[name] || null; }
  insertSheet(name) { const s = new MockSheet(name); this.sheets[name] = s; return s; }
}

function createMockSpreadsheetApp() {
  const ss = new MockSpreadsheet();
  return { getActiveSpreadsheet: () => ss, __ss: ss };
}

module.exports = { createMockSpreadsheetApp };
