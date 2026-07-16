/**
 * SP-001 — Quản lý phòng & khách thuê
 * Spec: docs/PRODUCT_SPECS/SP-001_QuanLyPhong_KhachThue.md
 * Schema: docs/DATA_SCHEMA_STANDARD_CLU-01.md
 */

function doGet(e) {
  // SHARED
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Quản lý phòng & khách thuê')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function khoiTaoDuLieu() {
  // SHARED — chạy 1 lần thủ công sau khi tạo Sheet mới, tạo đúng header theo Data Schema Standard
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var schemas = {
    'Phong': ['ID', 'TenPhong', 'GiaThue', 'TrangThai', 'NgayTao', 'NgayCapNhat'],
    'KhachThue': ['ID', 'HoTen', 'SDT', 'PhongID', 'NgayVaoO', 'TrangThai', 'NgayTao', 'NgayCapNhat']
  };
  Object.keys(schemas).forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(schemas[name]);
      sheet.setFrozenRows(1);
    }
  });
}

// ============ SHARED — Backend Core Library (ứng viên tách Module 3) ============

function getSS_() {
  // SHARED
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sinhIDTuDong_(prefix, sheetName) {
  // SHARED — sinh ID tăng dần theo format {prefix}-000X
  var sheet = getSS_().getSheetByName(sheetName);
  var lastRow = sheet.getLastRow();
  var maxNum = 0;
  if (lastRow >= 2) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    ids.forEach(function (r) {
      var id = r[0];
      if (typeof id === 'string' && id.indexOf(prefix + '-') === 0) {
        var num = parseInt(id.split('-')[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
  }
  return prefix + '-' + ('000' + (maxNum + 1)).slice(-4);
}

function docBangThanhJSON_(sheetName) {
  // SHARED — đọc toàn bộ sheet, trả mảng object theo header
  var sheet = getSS_().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  return data.map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function ghiDongMoi_(sheetName, rowObject) {
  // SHARED — ghi 1 dòng mới đúng thứ tự cột của header
  var sheet = getSS_().getSheetByName(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function (h) { return rowObject[h] !== undefined ? rowObject[h] : ''; });
  sheet.appendRow(row);
}

function timDongTheoID_(sheetName, id) {
  // SHARED — trả về row index (1-based, tính cả header) theo cột ID
  var sheet = getSS_().getSheetByName(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2;
  }
  return -1;
}

function capNhatDong_(sheetName, id, updates) {
  // SHARED — cập nhật các cột chỉ định của 1 dòng theo ID
  var sheet = getSS_().getSheetByName(sheetName);
  var rowIndex = timDongTheoID_(sheetName, id);
  if (rowIndex === -1) throw new Error('Không tìm thấy ID: ' + id + ' trong bảng ' + sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach(function (h, i) {
    if (updates[h] !== undefined) sheet.getRange(rowIndex, i + 1).setValue(updates[h]);
  });
}

// ============ PRODUCT-SPECIFIC — logic riêng của SP-001 ============

function layDanhSachPhong() {
  // PRODUCT-SPECIFIC
  var phongs = docBangThanhJSON_('Phong');
  var khachDangO = docBangThanhJSON_('KhachThue').filter(function (k) { return k.TrangThai === 'Đang thuê'; });
  return phongs.map(function (p) {
    var khach = khachDangO.filter(function (k) { return k.PhongID === p.ID; })[0];
    p.KhachHienTai = khach ? khach.HoTen : null;
    return p;
  });
}

function layDanhSachPhongTrong() {
  // PRODUCT-SPECIFIC — dùng cho dropdown khi thêm khách
  return docBangThanhJSON_('Phong').filter(function (p) { return p.TrangThai === 'Trống'; });
}

function themPhong(data) {
  // PRODUCT-SPECIFIC
  if (!data.TenPhong) throw new Error('Thiếu tên phòng');
  var id = sinhIDTuDong_('PH', 'Phong');
  var now = new Date();
  ghiDongMoi_('Phong', {
    ID: id, TenPhong: data.TenPhong, GiaThue: Number(data.GiaThue) || 0,
    TrangThai: 'Trống', NgayTao: now, NgayCapNhat: now
  });
  return id;
}

function suaPhong(id, data) {
  // PRODUCT-SPECIFIC
  data.NgayCapNhat = new Date();
  capNhatDong_('Phong', id, data);
  return true;
}

function themKhachThue(data) {
  // PRODUCT-SPECIFIC
  if (!/^0\d{9}$/.test(data.SDT)) {
    throw new Error('Số điện thoại không hợp lệ — phải đủ 10 số và bắt đầu bằng 0');
  }
  var phong = docBangThanhJSON_('Phong').filter(function (p) { return p.ID === data.PhongID; })[0];
  if (!phong) throw new Error('Không tìm thấy phòng');
  if (phong.TrangThai !== 'Trống') throw new Error('Phòng này đã có khách, không thể gán thêm');

  var id = sinhIDTuDong_('KH', 'KhachThue');
  var now = new Date();
  ghiDongMoi_('KhachThue', {
    ID: id, HoTen: data.HoTen, SDT: data.SDT, PhongID: data.PhongID,
    NgayVaoO: data.NgayVaoO ? new Date(data.NgayVaoO) : now,
    TrangThai: 'Đang thuê', NgayTao: now, NgayCapNhat: now
  });
  capNhatDong_('Phong', data.PhongID, { TrangThai: 'Đã thuê', NgayCapNhat: now });
  return id;
}

function suaKhachThue(id, data) {
  // PRODUCT-SPECIFIC
  if (data.SDT && !/^0\d{9}$/.test(data.SDT)) {
    throw new Error('Số điện thoại không hợp lệ');
  }
  data.NgayCapNhat = new Date();
  capNhatDong_('KhachThue', id, data);
  return true;
}

function traPhong(khachThueId) {
  // PRODUCT-SPECIFIC
  var khach = docBangThanhJSON_('KhachThue').filter(function (k) { return k.ID === khachThueId; })[0];
  if (!khach) throw new Error('Không tìm thấy khách thuê');
  var now = new Date();
  capNhatDong_('KhachThue', khachThueId, { TrangThai: 'Đã trả phòng', NgayCapNhat: now });
  capNhatDong_('Phong', khach.PhongID, { TrangThai: 'Trống', NgayCapNhat: now });
  return true;
}

function timKiemKhach(query) {
  // PRODUCT-SPECIFIC
  query = (query || '').toLowerCase().trim();
  var all = docBangThanhJSON_('KhachThue');
  if (!query) return all;
  return all.filter(function (k) {
    return k.HoTen.toLowerCase().indexOf(query) !== -1 || String(k.SDT).indexOf(query) !== -1;
  });
}

function layChiTietPhong(phongId) {
  // PRODUCT-SPECIFIC — dùng cho màn Chi tiết phòng
  var phong = docBangThanhJSON_('Phong').filter(function (p) { return p.ID === phongId; })[0];
  var lichSuKhach = docBangThanhJSON_('KhachThue')
    .filter(function (k) { return k.PhongID === phongId; })
    .sort(function (a, b) { return new Date(b.NgayVaoO) - new Date(a.NgayVaoO); });
  return { phong: phong, lichSuKhach: lichSuKhach };
}

function layThongKeDashboard() {
  // PRODUCT-SPECIFIC
  var phongs = docBangThanhJSON_('Phong');
  var trong = phongs.filter(function (p) { return p.TrangThai === 'Trống'; }).length;
  var daThue = phongs.filter(function (p) { return p.TrangThai === 'Đã thuê'; }).length;
  return { tongPhong: phongs.length, phongTrong: trong, phongDaThue: daThue };
}
