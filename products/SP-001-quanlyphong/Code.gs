/**
 * SP-001 — Quản lý phòng & khách thuê
 * Spec đầy đủ: docs/PRODUCT_SPECS/SP-001_QuanLyPhong_KhachThue.md
 * Schema đầy đủ: docs/DATA_SCHEMA_STANDARD_CLU-01.md
 *
 * QUY TẮC: mỗi hàm dưới đây gắn // SHARED hoặc // PRODUCT-SPECIFIC.
 * Antigravity giữ nguyên comment này và thêm cho MỌI hàm mới viết ra —
 * đây là input để tách Backend Core Library (Module 3) ở bước sau.
 */

function doGet(e) {
  // SHARED — Khung serve HTML hoặc REST API GET theo tham số action (hỗ trợ Standalone Web App đọc data)
  try {
    if (e && e.parameter && e.parameter.action) {
      var action = e.parameter.action;
      var query = e.parameter.query || '';
      var id = e.parameter.id || '';
      var result = { success: false, message: 'Action GET không hợp lệ: ' + action };

      if (action === 'layDanhSachPhong') {
        result = layDanhSachPhong();
      } else if (action === 'layThongKeDashboard') {
        result = layThongKeDashboard();
      } else if (action === 'layDanhSachPhongTrong') {
        result = layDanhSachPhongTrong();
      } else if (action === 'layDanhSachKhachThue') {
        result = layDanhSachKhachThue();
      } else if (action === 'timKiemKhach') {
        result = timKiemKhach(query);
      } else if (action === 'layChiTietPhong') {
        result = layChiTietPhong(id);
      }

      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Lỗi server doGet: ' + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('SP-001 — Quản lý phòng & khách thuê')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  // SHARED — Router REST API chuẩn cho Standalone Web App (GitHub Pages / Local) gửi payload qua fetch(POST)
  try {
    var rawContents = e && e.postData ? e.postData.contents : '{}';
    var payload = JSON.parse(rawContents);
    var action = payload.action;
    var data = payload.data || {};
    var result = { success: false, message: 'Action POST không hợp lệ: ' + action };

    if (action === 'layDanhSachPhong') {
      result = layDanhSachPhong();
    } else if (action === 'themPhong') {
      result = themPhong(data);
    } else if (action === 'suaPhong') {
      result = suaPhong(data.id || (typeof data === 'string' ? data : ''), data);
    } else if (action === 'xoaPhong') {
      result = xoaPhong(data.id || (typeof data === 'string' ? data : ''));
    } else if (action === 'themKhachThue') {
      result = themKhachThue(data);
    } else if (action === 'suaKhachThue') {
      result = suaKhachThue(data.id || (typeof data === 'string' ? data : ''), data);
    } else if (action === 'traPhong') {
      result = traPhong(data.khachThueId || (typeof data === 'string' ? data : ''));
    } else if (action === 'timKiemKhach') {
      result = timKiemKhach(data.query || (typeof data === 'string' ? data : ''));
    } else if (action === 'layThongKeDashboard') {
      result = layThongKeDashboard();
    } else if (action === 'layChiTietPhong') {
      result = layChiTietPhong(data.id || (typeof data === 'string' ? data : ''));
    } else if (action === 'layDanhSachPhongTrong') {
      result = layDanhSachPhongTrong();
    } else if (action === 'layDanhSachKhachThue') {
      result = layDanhSachKhachThue();
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Lỗi server router doPost: ' + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- Phòng ----

function layDanhSachPhong() {
  // PRODUCT-SPECIFIC — đọc bảng Phong, trả về JSON kèm thông tin khách đang thuê
  try {
    var danhSachPhong = docBangThanhJSON('Phong');
    var danhSachKhach = docBangThanhJSON('KhachThue');
    
    for (var i = 0; i < danhSachPhong.length; i++) {
      var p = danhSachPhong[i];
      var khach = null;
      for (var j = 0; j < danhSachKhach.length; j++) {
        if (String(danhSachKhach[j].PhongID).trim() === String(p.ID).trim() && danhSachKhach[j].TrangThai === 'Đang thuê') {
          khach = danhSachKhach[j];
          break;
        }
      }
      if (khach) {
        p.KhachHienTai = khach.HoTen;
        p.KhachHienTaiSDT = khach.SDT;
        p.KhachHienTaiID = khach.ID;
        p.NgayVaoO = khach.NgayVaoO;
      } else {
        p.KhachHienTai = '';
        p.KhachHienTaiSDT = '';
        p.KhachHienTaiID = '';
        p.NgayVaoO = '';
      }
    }
    return { success: true, data: danhSachPhong };
  } catch (err) {
    return { success: false, message: 'Lỗi khi tải danh sách phòng: ' + err.message };
  }
}

function themPhong(data) {
  // PRODUCT-SPECIFIC — tạo dòng mới trong Phong, ID tự sinh theo format PH-000X
  try {
    if (!data || !data.TenPhong || String(data.TenPhong).trim() === '') {
      return { success: false, message: 'Tên phòng không được để trống.' };
    }
    var gia = Number(data.GiaThue);
    if (isNaN(gia) || gia < 0) {
      return { success: false, message: 'Giá thuê phải là số hợp lệ (≥ 0).' };
    }
    
    var tenPhongClean = String(data.TenPhong).trim();
    var danhSachPhong = docBangThanhJSON('Phong');
    for (var i = 0; i < danhSachPhong.length; i++) {
      if (String(danhSachPhong[i].TenPhong).trim().toLowerCase() === tenPhongClean.toLowerCase()) {
        return { success: false, message: 'Tên phòng "' + tenPhongClean + '" đã tồn tại trong hệ thống.' };
      }
    }
    
    var newId = sinhIDTuDong('PH', 'Phong');
    var now = new Date();
    var tz = Session.getScriptTimeZone();
    var formattedNow = Utilities.formatDate(now, tz, "yyyy-MM-dd HH:mm:ss");
    
    var rowObject = {
      ID: newId,
      TenPhong: tenPhongClean,
      GiaThue: gia,
      TrangThai: 'Trống',
      NgayTao: formattedNow,
      NgayCapNhat: formattedNow
    };
    
    ghiDongMoi('Phong', rowObject);
    return { success: true, message: 'Thêm phòng "' + tenPhongClean + '" (' + newId + ') thành công!', data: rowObject };
  } catch (err) {
    return { success: false, message: 'Lỗi khi thêm phòng: ' + err.message };
  }
}

function suaPhong(id, data) {
  // PRODUCT-SPECIFIC — sửa thông tin phòng theo ID
  try {
    if (!id || String(id).trim() === '') {
      return { success: false, message: 'ID phòng không hợp lệ.' };
    }
    if (!data || !data.TenPhong || String(data.TenPhong).trim() === '') {
      return { success: false, message: 'Tên phòng không được để trống.' };
    }
    var gia = Number(data.GiaThue);
    if (isNaN(gia) || gia < 0) {
      return { success: false, message: 'Giá thuê phải là số hợp lệ (≥ 0).' };
    }
    
    var cleanId = String(id).trim();
    var tenPhongClean = String(data.TenPhong).trim();
    
    var danhSachPhong = docBangThanhJSON('Phong');
    for (var i = 0; i < danhSachPhong.length; i++) {
      if (String(danhSachPhong[i].TenPhong).trim().toLowerCase() === tenPhongClean.toLowerCase() && String(danhSachPhong[i].ID).trim() !== cleanId) {
        return { success: false, message: 'Tên phòng "' + tenPhongClean + '" đã bị trùng với phòng khác.' };
      }
    }
    
    var updateFields = {
      TenPhong: tenPhongClean,
      GiaThue: gia
    };
    if (data.TrangThai && (data.TrangThai === 'Trống' || data.TrangThai === 'Đã thuê')) {
      updateFields.TrangThai = data.TrangThai;
    }
    
    var updated = capNhatDong('Phong', cleanId, updateFields);
    if (!updated) {
      return { success: false, message: 'Không tìm thấy phòng có ID ' + cleanId };
    }
    return { success: true, message: 'Cập nhật phòng "' + tenPhongClean + '" thành công!' };
  } catch (err) {
    return { success: false, message: 'Lỗi khi cập nhật phòng: ' + err.message };
  }
}

function xoaPhong(id) {
  // PRODUCT-SPECIFIC — xóa phòng (chỉ khi phòng đang Trống và không có khách thuê)
  try {
    if (!id || String(id).trim() === '') {
      return { success: false, message: 'ID phòng không hợp lệ.' };
    }
    var cleanId = String(id).trim();
    var danhSachKhach = docBangThanhJSON('KhachThue');
    for (var i = 0; i < danhSachKhach.length; i++) {
      if (String(danhSachKhach[i].PhongID).trim() === cleanId && danhSachKhach[i].TrangThai === 'Đang thuê') {
        return { success: false, message: 'Phòng đang có khách thuê (' + danhSachKhach[i].HoTen + '). Vui lòng làm thủ tục trả phòng trước khi xóa.' };
      }
    }
    var deleted = xoaDong('Phong', cleanId);
    if (!deleted) {
      return { success: false, message: 'Không tìm thấy phòng có ID ' + cleanId };
    }
    return { success: true, message: 'Đã xóa phòng thành công!' };
  } catch (err) {
    return { success: false, message: 'Lỗi khi xóa phòng: ' + err.message };
  }
}

function layChiTietPhong(id) {
  // PRODUCT-SPECIFIC — lấy thông tin sâu 1 phòng bao gồm khách hiện tại và lịch sử khách thuê cũ
  try {
    if (!id || String(id).trim() === '') {
      return { success: false, message: 'ID phòng không hợp lệ.' };
    }
    var cleanId = String(id).trim();
    var danhSachPhong = docBangThanhJSON('Phong');
    var phongChon = null;
    for (var i = 0; i < danhSachPhong.length; i++) {
      if (String(danhSachPhong[i].ID).trim() === cleanId) {
        phongChon = danhSachPhong[i];
        break;
      }
    }
    if (!phongChon) {
      return { success: false, message: 'Không tìm thấy phòng ' + cleanId };
    }
    
    var danhSachKhach = docBangThanhJSON('KhachThue');
    var khachHienTai = null;
    var lichSuKhach = [];
    
    for (var j = 0; j < danhSachKhach.length; j++) {
      if (String(danhSachKhach[j].PhongID).trim() === cleanId) {
        if (danhSachKhach[j].TrangThai === 'Đang thuê') {
          khachHienTai = danhSachKhach[j];
        } else {
          lichSuKhach.push(danhSachKhach[j]);
        }
      }
    }
    
    return {
      success: true,
      data: {
        phong: phongChon,
        khachHienTai: khachHienTai,
        lichSuKhach: lichSuKhach
      }
    };
  } catch (err) {
    return { success: false, message: 'Lỗi khi đọc chi tiết phòng: ' + err.message };
  }
}

function layDanhSachPhongTrong() {
  // PRODUCT-SPECIFIC — trả về danh sách các phòng có TrangThai = "Trống" cho dropdown form thêm khách
  try {
    var danhSachPhong = docBangThanhJSON('Phong');
    var phongTrong = [];
    for (var i = 0; i < danhSachPhong.length; i++) {
      if (danhSachPhong[i].TrangThai === 'Trống') {
        phongTrong.push(danhSachPhong[i]);
      }
    }
    return { success: true, data: phongTrong };
  } catch (err) {
    return { success: false, message: 'Lỗi khi tải danh sách phòng trống: ' + err.message };
  }
}

// ---- Khách thuê ----

function themKhachThue(data) {
  // PRODUCT-SPECIFIC — tạo dòng KhachThue + tự động đổi Phong.TrangThai = "Đã thuê"
  // Validation: không cho gán vào phòng đang "Đã thuê" (xem mục 7 của spec)
  try {
    if (!data || !data.HoTen || String(data.HoTen).trim() === '') {
      return { success: false, message: 'Họ tên khách thuê không được để trống.' };
    }
    if (!data.SDT || !validateSDT(data.SDT)) {
      return { success: false, message: 'Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng số 0).' };
    }
    if (!data.PhongID || String(data.PhongID).trim() === '') {
      return { success: false, message: 'Vui lòng chọn phòng trống.' };
    }
    
    var phongId = String(data.PhongID).trim();
    var danhSachPhong = docBangThanhJSON('Phong');
    var phongChon = null;
    for (var i = 0; i < danhSachPhong.length; i++) {
      if (String(danhSachPhong[i].ID).trim() === phongId) {
        phongChon = danhSachPhong[i];
        break;
      }
    }
    if (!phongChon) {
      return { success: false, message: 'Phòng đã chọn không tồn tại.' };
    }
    if (phongChon.TrangThai === 'Đã thuê') {
      return { success: false, message: 'Phòng ' + phongChon.TenPhong + ' hiện đang có khách thuê. Không thể thêm khách mới.' };
    }
    
    var danhSachKhach = docBangThanhJSON('KhachThue');
    for (var k = 0; k < danhSachKhach.length; k++) {
      if (String(danhSachKhach[k].PhongID).trim() === phongId && danhSachKhach[k].TrangThai === 'Đang thuê') {
        return { success: false, message: 'Phòng ' + phongChon.TenPhong + ' đang có khách thuê (' + danhSachKhach[k].HoTen + ').' };
      }
    }
    
    var newId = sinhIDTuDong('KH', 'KhachThue');
    var tz = Session.getScriptTimeZone();
    var now = new Date();
    var formattedNow = Utilities.formatDate(now, tz, "yyyy-MM-dd HH:mm:ss");
    var ngayVaoO = data.NgayVaoO ? String(data.NgayVaoO).trim() : Utilities.formatDate(now, tz, "yyyy-MM-dd");
    
    var rowObject = {
      ID: newId,
      HoTen: String(data.HoTen).trim(),
      SDT: String(data.SDT).trim(),
      PhongID: phongId,
      NgayVaoO: ngayVaoO,
      TrangThai: 'Đang thuê',
      NgayTao: formattedNow,
      NgayCapNhat: formattedNow
    };
    
    ghiDongMoi('KhachThue', rowObject);
    capNhatDong('Phong', phongId, { TrangThai: 'Đã thuê' });
    
    return { success: true, message: 'Gán khách thuê "' + rowObject.HoTen + '" vào ' + phongChon.TenPhong + ' thành công!', data: rowObject };
  } catch (err) {
    return { success: false, message: 'Lỗi khi thêm khách thuê: ' + err.message };
  }
}

function suaKhachThue(id, data) {
  // PRODUCT-SPECIFIC — sửa thông tin khách thuê (tên, SĐT, chuyển phòng)
  try {
    if (!id || String(id).trim() === '') {
      return { success: false, message: 'ID khách thuê không hợp lệ.' };
    }
    if (!data || !data.HoTen || String(data.HoTen).trim() === '') {
      return { success: false, message: 'Họ tên khách thuê không được để trống.' };
    }
    if (!data.SDT || !validateSDT(data.SDT)) {
      return { success: false, message: 'Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng số 0).' };
    }
    
    var cleanId = String(id).trim();
    var danhSachKhach = docBangThanhJSON('KhachThue');
    var khachCu = null;
    for (var i = 0; i < danhSachKhach.length; i++) {
      if (String(danhSachKhach[i].ID).trim() === cleanId) {
        khachCu = danhSachKhach[i];
        break;
      }
    }
    if (!khachCu) {
      return { success: false, message: 'Không tìm thấy thông tin khách thuê.' };
    }
    
    var updateFields = {
      HoTen: String(data.HoTen).trim(),
      SDT: String(data.SDT).trim()
    };
    if (data.NgayVaoO) {
      updateFields.NgayVaoO = String(data.NgayVaoO).trim();
    }
    
    if (data.PhongID && String(data.PhongID).trim() !== String(khachCu.PhongID).trim() && khachCu.TrangThai === 'Đang thuê') {
      var newPhongId = String(data.PhongID).trim();
      var oldPhongId = String(khachCu.PhongID).trim();
      
      var danhSachPhong = docBangThanhJSON('Phong');
      var phongMoiChon = null;
      for (var p = 0; p < danhSachPhong.length; p++) {
        if (String(danhSachPhong[p].ID).trim() === newPhongId) {
          phongMoiChon = danhSachPhong[p];
          break;
        }
      }
      if (!phongMoiChon || phongMoiChon.TrangThai !== 'Trống') {
        return { success: false, message: 'Phòng mới đã chọn không trống hoặc không tồn tại.' };
      }
      
      updateFields.PhongID = newPhongId;
      capNhatDong('Phong', oldPhongId, { TrangThai: 'Trống' });
      capNhatDong('Phong', newPhongId, { TrangThai: 'Đã thuê' });
    }
    
    capNhatDong('KhachThue', cleanId, updateFields);
    return { success: true, message: 'Cập nhật thông tin khách thuê "' + updateFields.HoTen + '" thành công!' };
  } catch (err) {
    return { success: false, message: 'Lỗi khi cập nhật khách thuê: ' + err.message };
  }
}

function traPhong(khachThueId) {
  // PRODUCT-SPECIFIC — đổi KhachThue.TrangThai = "Đã trả phòng", Phong.TrangThai = "Trống"
  // Không xóa dòng — giữ lịch sử (xem mục 7 của spec)
  try {
    if (!khachThueId || String(khachThueId).trim() === '') {
      return { success: false, message: 'ID khách thuê không hợp lệ.' };
    }
    var idKhach = String(khachThueId).trim();
    var danhSachKhach = docBangThanhJSON('KhachThue');
    var khachChon = null;
    for (var i = 0; i < danhSachKhach.length; i++) {
      if (String(danhSachKhach[i].ID).trim() === idKhach) {
        khachChon = danhSachKhach[i];
        break;
      }
    }
    if (!khachChon) {
      return { success: false, message: 'Không tìm thấy thông tin khách thuê (' + idKhach + ').' };
    }
    if (khachChon.TrangThai === 'Đã trả phòng') {
      return { success: false, message: 'Khách thuê "' + khachChon.HoTen + '" đã làm thủ tục trả phòng trước đó.' };
    }
    
    var phongId = String(khachChon.PhongID).trim();
    capNhatDong('KhachThue', idKhach, { TrangThai: 'Đã trả phòng' });
    if (phongId) {
      capNhatDong('Phong', phongId, { TrangThai: 'Trống' });
    }
    
    return { success: true, message: 'Đã hoàn tất thủ tục trả phòng cho khách "' + khachChon.HoTen + '". Phòng hiện đã trống!' };
  } catch (err) {
    return { success: false, message: 'Lỗi khi làm thủ tục trả phòng: ' + err.message };
  }
}

function timKiemKhach(query) {
  // PRODUCT-SPECIFIC — tìm theo HoTen hoặc SDT hoặc ID, kèm tên phòng
  try {
    var danhSachKhach = docBangThanhJSON('KhachThue');
    var danhSachPhong = docBangThanhJSON('Phong');
    
    var phongMap = {};
    for (var i = 0; i < danhSachPhong.length; i++) {
      phongMap[String(danhSachPhong[i].ID).trim()] = danhSachPhong[i].TenPhong;
    }
    
    var qClean = query ? String(query).trim().toLowerCase() : '';
    var result = [];
    
    for (var j = 0; j < danhSachKhach.length; j++) {
      var k = danhSachKhach[j];
      k.TenPhong = phongMap[String(k.PhongID).trim()] || k.PhongID || '—';
      
      if (!qClean) {
        result.push(k);
      } else {
        var matchTen = String(k.HoTen || '').toLowerCase().indexOf(qClean) !== -1;
        var matchSDT = String(k.SDT || '').toLowerCase().indexOf(qClean) !== -1;
        var matchID = String(k.ID || '').toLowerCase().indexOf(qClean) !== -1;
        var matchPhong = String(k.TenPhong || '').toLowerCase().indexOf(qClean) !== -1;
        if (matchTen || matchSDT || matchID || matchPhong) {
          result.push(k);
        }
      }
    }
    
    result.sort(function(a, b) {
      if (a.TrangThai === 'Đang thuê' && b.TrangThai !== 'Đang thuê') return -1;
      if (a.TrangThai !== 'Đang thuê' && b.TrangThai === 'Đang thuê') return 1;
      return String(b.ID).localeCompare(String(a.ID));
    });
    
    return { success: true, data: result };
  } catch (err) {
    return { success: false, message: 'Lỗi khi tra cứu khách thuê: ' + err.message };
  }
}

function layDanhSachKhachThue() {
  // PRODUCT-SPECIFIC — trả về danh sách toàn bộ khách thuê kèm tên phòng
  return timKiemKhach('');
}

// ---- Dashboard ----

function layThongKeDashboard() {
  // PRODUCT-SPECIFIC — đếm tổng phòng, phòng trống, phòng đã thuê, số lượng khách đang thuê
  try {
    var danhSachPhong = docBangThanhJSON('Phong');
    var danhSachKhach = docBangThanhJSON('KhachThue');
    
    var tongSoPhong = danhSachPhong.length;
    var phongTrong = 0;
    var phongDaThue = 0;
    
    for (var i = 0; i < danhSachPhong.length; i++) {
      if (danhSachPhong[i].TrangThai === 'Đã thuê') {
        phongDaThue++;
      } else {
        phongTrong++;
      }
    }
    
    var khachDangThue = 0;
    var khachDaTra = 0;
    for (var j = 0; j < danhSachKhach.length; j++) {
      if (danhSachKhach[j].TrangThai === 'Đang thuê') {
        khachDangThue++;
      } else {
        khachDaTra++;
      }
    }
    
    return {
      success: true,
      data: {
        tongSoPhong: tongSoPhong,
        phongTrong: phongTrong,
        phongDaThue: phongDaThue,
        khachDangThue: khachDangThue,
        khachDaTra: khachDaTra
      }
    };
  } catch (err) {
    return { success: false, message: 'Lỗi khi tải thống kê dashboard: ' + err.message };
  }
}

// ---- Helper dùng chung, nên tách vào Backend Core Library ----

function sinhIDTuDong(prefix, sheetName) {
  // SHARED — sinh ID tăng dần theo format {prefix}-000X, dùng lại cho mọi bảng/mọi sản phẩm
  var sheet = getOrInitializeSheet(sheetName);
  var lastRow = sheet.getLastRow();
  var maxIdNum = 0;
  
  if (lastRow > 1) {
    var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < idValues.length; i++) {
      var val = String(idValues[i][0]).trim();
      if (val.indexOf(prefix + '-') === 0) {
        var numPart = parseInt(val.substring(prefix.length + 1), 10);
        if (!isNaN(numPart) && numPart > maxIdNum) {
          maxIdNum = numPart;
        }
      }
    }
  }
  
  var newNum = maxIdNum + 1;
  var formattedNum = ('0000' + newNum).slice(-4);
  return prefix + '-' + formattedNum;
}

function docBangThanhJSON(sheetName) {
  // SHARED — đọc toàn bộ 1 sheet, trả về mảng object theo header — CRUD helper nền tảng
  var sheet = getOrInitializeSheet(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }
  var lastCol = sheet.getLastColumn();
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var result = [];
  var tz = Session.getScriptTimeZone();
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var isEmptyRow = true;
    for (var k = 0; k < row.length; k++) {
      if (row[k] !== "" && row[k] !== null && row[k] !== undefined) {
        isEmptyRow = false;
        break;
      }
    }
    if (isEmptyRow) continue;
    
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = String(headers[j]).trim();
      if (!key) continue;
      var val = row[j];
      if (val instanceof Date) {
        if (key === 'NgayTao' || key === 'NgayCapNhat') {
          obj[key] = Utilities.formatDate(val, tz, "yyyy-MM-dd HH:mm:ss");
        } else {
          obj[key] = Utilities.formatDate(val, tz, "yyyy-MM-dd");
        }
      } else if (val === null || val === undefined) {
        obj[key] = "";
      } else {
        obj[key] = val;
      }
    }
    result.push(obj);
  }
  return result;
}

function ghiDongMoi(sheetName, rowObject) {
  // SHARED — ghi 1 dòng mới vào sheet theo đúng thứ tự cột của header
  var sheet = getOrInitializeSheet(sheetName);
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return false;
  
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var tz = Session.getScriptTimeZone();
  var rowValues = [];
  
  for (var i = 0; i < headers.length; i++) {
    var headerName = String(headers[i]).trim();
    var val = rowObject[headerName];
    if (val === undefined || val === null) {
      if (headerName === 'NgayTao' || headerName === 'NgayCapNhat') {
        rowValues.push(Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss"));
      } else {
        rowValues.push("");
      }
    } else if (val instanceof Date) {
      if (headerName === 'NgayTao' || headerName === 'NgayCapNhat') {
        rowValues.push(Utilities.formatDate(val, tz, "yyyy-MM-dd HH:mm:ss"));
      } else {
        rowValues.push(Utilities.formatDate(val, tz, "yyyy-MM-dd"));
      }
    } else {
      rowValues.push(val);
    }
  }
  
  sheet.appendRow(rowValues);
  return true;
}

function capNhatDong(sheetName, id, rowObject) {
  // SHARED — cập nhật dữ liệu của 1 dòng theo ID trong sheet, tự động cập nhật NgayCapNhat
  var sheet = getOrInitializeSheet(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var dataValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  var idIndex = -1;
  for (var j = 0; j < headers.length; j++) {
    if (String(headers[j]).trim() === 'ID') {
      idIndex = j;
      break;
    }
  }
  if (idIndex === -1) idIndex = 0;
  
  for (var i = 0; i < dataValues.length; i++) {
    if (String(dataValues[i][idIndex]).trim() === String(id).trim()) {
      var rowNum = i + 2;
      var updatedRow = dataValues[i].slice();
      var tz = Session.getScriptTimeZone();
      
      for (var k = 0; k < headers.length; k++) {
        var headerName = String(headers[k]).trim();
        if (headerName === 'NgayCapNhat') {
          updatedRow[k] = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");
        } else if (rowObject[headerName] !== undefined) {
          if (rowObject[headerName] instanceof Date) {
            updatedRow[k] = Utilities.formatDate(rowObject[headerName], tz, "yyyy-MM-dd HH:mm:ss");
          } else {
            updatedRow[k] = rowObject[headerName];
          }
        }
      }
      sheet.getRange(rowNum, 1, 1, lastCol).setValues([updatedRow]);
      return true;
    }
  }
  return false;
}

function xoaDong(sheetName, id) {
  // SHARED — xóa 1 dòng khỏi sheet theo ID
  var sheet = getOrInitializeSheet(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var idIndex = -1;
  for (var j = 0; j < headers.length; j++) {
    if (String(headers[j]).trim() === 'ID') {
      idIndex = j;
      break;
    }
  }
  if (idIndex === -1) idIndex = 0;
  
  var idValues = sheet.getRange(2, idIndex + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < idValues.length; i++) {
    if (String(idValues[i][0]).trim() === String(id).trim()) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }
  return false;
}

function validateSDT(sdt) {
  // SHARED — kiểm tra số điện thoại đúng chuẩn Việt Nam (10 chữ số, bắt đầu bằng số 0)
  if (!sdt) return false;
  var cleanSDT = String(sdt).trim();
  var regex = /^0\d{9}$/;
  return regex.test(cleanSDT);
}

function getSpreadsheet_() {
  // SHARED — lấy Spreadsheet hiện tại (bound) hoặc theo SPREADSHEET_ID (standalone)
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  var prop = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (prop) {
    return SpreadsheetApp.openById(prop);
  }
  throw new Error('Không tìm thấy Spreadsheet. Vui lòng gắn script vào Google Spreadsheet hoặc cấu hình SPREADSHEET_ID trong ScriptProperties.');
}

function getOrInitializeSheet(sheetName) {
  // SHARED — lấy Sheet theo tên, tự động khởi tạo đúng schema chuẩn nếu sheet chưa tồn tại
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  if (sheet.getLastRow() === 0) {
    var headers = [];
    if (sheetName === 'Phong') {
      headers = ['ID', 'TenPhong', 'GiaThue', 'TrangThai', 'NgayTao', 'NgayCapNhat'];
    } else if (sheetName === 'KhachThue') {
      headers = ['ID', 'HoTen', 'SDT', 'PhongID', 'NgayVaoO', 'TrangThai', 'NgayTao', 'NgayCapNhat'];
    }
    if (headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  }
  return sheet;
}
