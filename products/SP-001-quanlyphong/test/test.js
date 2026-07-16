// Test logic thật của Code.gs bằng cách nạp vào VM context với SpreadsheetApp giả lập.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createMockSpreadsheetApp } = require('../../../test-utils/mock-gas');

const code = fs.readFileSync(path.join(__dirname, '../Code.gs'), 'utf8');
const SpreadsheetApp = createMockSpreadsheetApp();
const HtmlService = { createHtmlOutputFromFile: () => ({ setTitle: () => ({ addMetaTag: () => ({}) }) }) };

const sandbox = { SpreadsheetApp, HtmlService, console };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

let pass = 0, fail = 0;
function assert(desc, cond) {
  if (cond) { pass++; console.log('✓ ' + desc); }
  else { fail++; console.log('✗ ' + desc); }
}
function assertThrows(desc, fn) {
  try { fn(); fail++; console.log('✗ ' + desc + ' (lẽ ra phải throw nhưng không throw)'); }
  catch (e) { pass++; console.log('✓ ' + desc + ' → chặn đúng: "' + e.message + '"'); }
}

sandbox.khoiTaoDuLieu();
assert('khoiTaoDuLieu tạo đủ 2 sheet Phong + KhachThue',
  SpreadsheetApp.__ss.getSheetByName('Phong') && SpreadsheetApp.__ss.getSheetByName('KhachThue'));

const idPhong1 = sandbox.themPhong({ TenPhong: 'Phòng 101', GiaThue: 2500000 });
assert('themPhong sinh ID đúng format PH-0001', idPhong1 === 'PH-0001');
const idPhong2 = sandbox.themPhong({ TenPhong: 'Phòng 102', GiaThue: 2800000 });
assert('ID phòng thứ 2 tăng dần đúng PH-0002', idPhong2 === 'PH-0002');

assert('2 phòng đều đang trống sau khi tạo', sandbox.layDanhSachPhongTrong().length === 2);

const idKhach1 = sandbox.themKhachThue({ HoTen: 'Nguyễn Văn A', SDT: '0901234567', PhongID: idPhong1, NgayVaoO: '2026-07-16' });
assert('themKhachThue sinh ID đúng format KH-0001', idKhach1 === 'KH-0001');

let p1 = sandbox.layDanhSachPhong().find(p => p.ID === idPhong1);
assert('Phòng tự động chuyển "Đã thuê" sau khi thêm khách', p1.TrangThai === 'Đã thuê');
assert('Phòng hiển thị đúng tên khách hiện tại', p1.KhachHienTai === 'Nguyễn Văn A');

assertThrows('Chặn thêm khách vào phòng đã có người', () => {
  sandbox.themKhachThue({ HoTen: 'Trần Thị B', SDT: '0912345678', PhongID: idPhong1 });
});
assertThrows('Chặn SĐT thiếu số', () => {
  sandbox.themKhachThue({ HoTen: 'C', SDT: '090123', PhongID: idPhong2 });
});
assertThrows('Chặn SĐT không bắt đầu bằng 0', () => {
  sandbox.themKhachThue({ HoTen: 'C', SDT: '1901234567', PhongID: idPhong2 });
});

const idKhach2 = sandbox.themKhachThue({ HoTen: 'Lê Thị C', SDT: '0987654321', PhongID: idPhong2 });

let dash = sandbox.layThongKeDashboard();
assert('Dashboard đếm đúng: 2 phòng, 0 trống, 2 đã thuê',
  dash.tongPhong === 2 && dash.phongTrong === 0 && dash.phongDaThue === 2);

let timTheoTen = sandbox.timKiemKhach('nguyễn');
assert('Tìm kiếm theo tên (không phân biệt hoa/thường)', timTheoTen.length === 1 && timTheoTen[0].ID === idKhach1);
let timTheoSDT = sandbox.timKiemKhach('0987');
assert('Tìm kiếm theo SĐT', timTheoSDT.length === 1 && timTheoSDT[0].ID === idKhach2);

sandbox.traPhong(idKhach1);
let p1SauTra = sandbox.layDanhSachPhong().find(p => p.ID === idPhong1);
assert('Trả phòng: Phong.TrangThai về "Trống"', p1SauTra.TrangThai === 'Trống');

let chiTiet = sandbox.layChiTietPhong(idPhong1);
let khachCu = chiTiet.lichSuKhach.find(k => k.ID === idKhach1);
assert('Trả phòng: giữ lại lịch sử, không xóa dòng khách', khachCu && khachCu.TrangThai === 'Đã trả phòng');
assert('Phòng có lại trong danh sách phòng trống sau khi trả', sandbox.layDanhSachPhongTrong().some(p => p.ID === idPhong1));

console.log('\n' + pass + ' pass, ' + fail + ' fail (tổng ' + (pass + fail) + ' test — khớp Definition of Done trong spec SP-001)');
process.exit(fail > 0 ? 1 : 0);
