/**
 * Factory OS — Product #25: TradingOS (v2 Multi-Tenant SaaS)
 * Standard #1, #4 & #6 compliant Business Logic API methods.
 */

var Api = {

  /**
   * 1. dangNhap(payload)
   * @param {Object} payload { email: string, password: string }
   * @returns {Object} { success: bool, token?: string, customer_id?: string, error?: string }
   */
  dangNhap: function(payload) {
    try {
      var email = payload ? String(payload.email || '').trim().toLowerCase() : '';
      var password = payload ? String(payload.password || '') : '';
      
      if (!email || !password) {
        return { success: false, error: 'Vui lòng nhập đầy đủ Email và Mật khẩu' };
      }
      
      var sheet = _getAccountsSheet();
      var users = _sheetToObjects(sheet);
      var hashedPassword = _hashPassword(password);
      
      var foundUser = null;
      for (var i = 0; i < users.length; i++) {
        var u = users[i];
        var uEmail = String(u.email || '').trim().toLowerCase();
        var uHash = String(u.password_hash || '').trim();
        
        if (uEmail === email && (uHash === hashedPassword || uHash === password)) {
          foundUser = u;
          break;
        }
      }
      
      if (!foundUser) {
        return { success: false, error: 'Email hoặc mật khẩu không chính xác' };
      }
      
      if (String(foundUser.trang_thai).toUpperCase() === 'INACTIVE' || String(foundUser.trang_thai).toUpperCase() === 'LOCKED') {
        return { success: false, error: 'Tài khoản đã bị khóa hoặc chưa được kích hoạt' };
      }
      
      var customerId = String(foundUser.customer_id).trim();
      var token = _taoToken(customerId);
      
      return {
        success: true,
        token: token,
        customer_id: customerId,
        ho_ten: foundUser.ho_ten || 'Trader'
      };
    } catch (err) {
      return { success: false, error: err.toString() };
    }
  },

  /**
   * 2. layDuLieuTongHop(payload)
   * @param {Object} payload { token: string }
   * @returns {Object} { trades: [...], config: {...}, stats: {...} }
   */
  layDuLieuTongHop: function(payload) {
    try {
      var token = payload ? payload.token : null;
      var customerId = _xacThucToken(token);
      
      // 1. Fetch DATA tab trades for customerId
      var dataSheet = _getTradingSheet('DATA');
      var rawTrades = _sheetToObjects(dataSheet);
      var customerTrades = [];
      
      for (var i = 0; i < rawTrades.length; i++) {
        var t = rawTrades[i];
        if (String(t.customer_id).trim() === customerId) {
          customerTrades.push({
            id: String(t.id || ''),
            customer_id: customerId,
            ngay_gio: String(t.ngay_gio || ''),
            cap_tien: String(t.cap_tien || ''),
            huong: String(t.huong || 'LONG').toUpperCase(),
            entry_price: Number(t.entry_price) || 0,
            stop_loss: Number(t.stop_loss) || 0,
            take_profit: Number(t.take_profit) || 0,
            rr_ratio: Number(t.rr_ratio) || 0,
            volume_usd: Number(t.volume_usd) || 0,
            lot: Number(t.lot) || 0,
            risk_percent: Number(t.risk_percent) || 5,
            trang_thai: String(t.trang_thai || 'DANG_CHAY').toUpperCase(),
            pnl_usd: Number(t.pnl_usd) || 0,
            pnl_r: Number(t.pnl_r) || 0,
            anh_htf: String(t.anh_htf || ''),
            anh_mtf: String(t.anh_mtf || ''),
            anh_ltf: String(t.anh_ltf || ''),
            ghi_chu_review: String(t.ghi_chu_review || t.ghi_chu || ''),
            setup_tag: String(t.setup_tag || t.loai_setup || ''),
            trang_thai_tam_ly: String(t.trang_thai_tam_ly || t.tam_ly || '')
          });
        }
      }
      
      // 2. Fetch CONFIG tab for customerId
      var configSheet = _getTradingSheet('CONFIG');
      var rawConfig = _sheetToObjects(configSheet);
      var vonGoc = 10000;
      var riskPercentMacDinh = 5;
      
      for (var j = 0; j < rawConfig.length; j++) {
        var c = rawConfig[j];
        if (String(c.customer_id).trim() === customerId) {
          var key = String(c.key).trim();
          var val = Number(c.value);
          if (key === 'von_goc' && !isNaN(val)) vonGoc = val;
          if (key === 'risk_percent_mac_dinh' && !isNaN(val)) riskPercentMacDinh = val;
        }
      }
      
      // 3. Compute Server-Side Stats (Standard #1)
      var netPnlUsd = 0;
      var netPnlR = 0;
      var totalClosed = 0;
      var winCount = 0;
      var grossWinUsd = 0;
      var grossLossUsd = 0;
      
      for (var k = 0; k < customerTrades.length; k++) {
        var tr = customerTrades[k];
        netPnlUsd += tr.pnl_usd;
        netPnlR += tr.pnl_r;
        
        if (tr.trang_thai !== 'DANG_CHAY') {
          totalClosed++;
          if (tr.trang_thai === 'WIN') {
            winCount++;
            if (tr.pnl_usd > 0) grossWinUsd += tr.pnl_usd;
          } else if (tr.trang_thai === 'LOSS') {
            if (tr.pnl_usd < 0) grossLossUsd += Math.abs(tr.pnl_usd);
          }
        }
      }
      
      var vonHienTai = Math.round((vonGoc + netPnlUsd) * 100) / 100;
      var riskLenhTiep = Math.round((vonHienTai * (riskPercentMacDinh / 100)) * 100) / 100;
      var winRate = totalClosed > 0 ? Math.round((winCount / totalClosed) * 1000) / 10 : 0;
      var profitFactor = grossLossUsd > 0 ? Math.round((grossWinUsd / grossLossUsd) * 100) / 100 : (grossWinUsd > 0 ? grossWinUsd : 0);
      
      return {
        success: true,
        trades: customerTrades,
        config: {
          von_goc: vonGoc,
          risk_percent_mac_dinh: riskPercentMacDinh
        },
        stats: {
          von_hien_tai: vonHienTai,
          risk_lenh_tiep: riskLenhTiep,
          win_rate: winRate,
          tong_lenh_dong: totalClosed,
          net_pnl_usd: Math.round(netPnlUsd * 100) / 100,
          profit_factor: profitFactor,
          net_pnl_r: Math.round(netPnlR * 100) / 100
        }
      };
    } catch (err) {
      return { success: false, error: err.toString() };
    }
  },

  /**
   * 3. taoLenhMoi(payload)
   * @param {Object} payload { token: string, trade: Object }
   * @returns {Object} { success: bool, id: string }
   */
  taoLenhMoi: function(payload) {
    var lock = _getLock();
    try {
      var token = payload ? payload.token : null;
      var customerId = _xacThucToken(token);
      var trade = (payload && payload.trade) ? payload.trade : payload;
      
      var newId = _generateTradeId();
      var sheet = _getTradingSheet('DATA');
      
      var row = [
        newId,
        customerId,
        trade.ngay_gio || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm'),
        trade.cap_tien || '',
        trade.huong || 'LONG',
        trade.entry_price || 0,
        trade.stop_loss || 0,
        trade.take_profit || 0,
        trade.rr_ratio || 0,
        trade.volume_usd || 0,
        trade.lot || 0,
        trade.risk_percent || 5,
        trade.trang_thai || 'DANG_CHAY',
        trade.pnl_usd || 0,
        trade.pnl_r || 0,
        trade.anh_htf || '',
        trade.anh_mtf || '',
        trade.anh_ltf || '',
        trade.ghi_chu_review || trade.ghi_chu || '',
        trade.setup_tag || trade.loai_setup || '',
        trade.trang_thai_tam_ly || trade.tam_ly || ''
      ];
      
      sheet.appendRow(row);
      lock.releaseLock();
      return { success: true, id: newId };
    } catch (err) {
      lock.releaseLock();
      return { success: false, error: err.toString() };
    }
  },

  /**
   * 4. capNhatLenh(payload)
   * @param {Object} payload { token: string, id: string, patch: Object }
   * @returns {Object} { success: bool }
   */
  capNhatLenh: function(payload) {
    var lock = _getLock();
    try {
      var token = payload ? payload.token : null;
      var customerId = _xacThucToken(token);
      var id = payload ? payload.id : null;
      var patch = payload ? (payload.patch || payload) : {};
      
      if (!id) {
        lock.releaseLock();
        return { success: false, error: 'Thiếu tham số ID lệnh' };
      }
      
      var sheet = _getTradingSheet('DATA');
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        lock.releaseLock();
        return { success: false, error: 'Không tìm thấy dữ liệu lệnh' };
      }
      
      var headers = data[0];
      var idColIdx = headers.indexOf('id');
      var custColIdx = headers.indexOf('customer_id');
      
      if (idColIdx === -1 || custColIdx === -1) {
        lock.releaseLock();
        return { success: false, error: 'Cấu trúc tab DATA không đúng định dạng' };
      }
      
      var targetRowIdx = -1;
      for (var r = 1; r < data.length; r++) {
        if (String(data[r][idColIdx]).trim() === String(id).trim()) {
          targetRowIdx = r + 1; // 1-based row index for Range
          var rowCustId = String(data[r][custColIdx]).trim();
          if (rowCustId !== customerId) {
            lock.releaseLock();
            return { success: false, error: 'Không có quyền chỉnh sửa lệnh này' };
          }
          break;
        }
      }
      
      if (targetRowIdx === -1) {
        lock.releaseLock();
        return { success: false, error: 'Không tìm thấy lệnh có ID: ' + id };
      }
      
      // Update fields specified in patch
      for (var c = 0; c < headers.length; c++) {
        var key = headers[c];
        if (patch.hasOwnProperty(key) && key !== 'id' && key !== 'customer_id') {
          sheet.getRange(targetRowIdx, c + 1).setValue(patch[key]);
        }
      }
      
      lock.releaseLock();
      return { success: true };
    } catch (err) {
      lock.releaseLock();
      return { success: false, error: err.toString() };
    }
  },

  /**
   * 5. xoaLenh(payload)
   * @param {Object} payload { token: string, id: string }
   * @returns {Object} { success: bool }
   */
  xoaLenh: function(payload) {
    var lock = _getLock();
    try {
      var token = payload ? payload.token : null;
      var customerId = _xacThucToken(token);
      var id = payload ? payload.id : null;
      
      if (!id) {
        lock.releaseLock();
        return { success: false, error: 'Thiếu tham số ID lệnh' };
      }
      
      var sheet = _getTradingSheet('DATA');
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var idColIdx = headers.indexOf('id');
      var custColIdx = headers.indexOf('customer_id');
      
      var targetRowIdx = -1;
      for (var r = 1; r < data.length; r++) {
        if (String(data[r][idColIdx]).trim() === String(id).trim()) {
          if (String(data[r][custColIdx]).trim() !== customerId) {
            lock.releaseLock();
            return { success: false, error: 'Không có quyền xóa lệnh này' };
          }
          targetRowIdx = r + 1;
          break;
        }
      }
      
      if (targetRowIdx === -1) {
        lock.releaseLock();
        return { success: false, error: 'Không tìm thấy lệnh để xóa' };
      }
      
      sheet.deleteRow(targetRowIdx);
      lock.releaseLock();
      return { success: true };
    } catch (err) {
      lock.releaseLock();
      return { success: false, error: err.toString() };
    }
  },

  /**
   * 6. capNhatConfig(payload)
   * @param {Object} payload { token: string, configPatch: Object }
   * @returns {Object} { success: bool }
   */
  capNhatConfig: function(payload) {
    var lock = _getLock();
    try {
      var token = payload ? payload.token : null;
      var customerId = _xacThucToken(token);
      var configPatch = payload ? (payload.configPatch || payload) : {};
      
      var sheet = _getTradingSheet('CONFIG');
      var data = sheet.getDataRange().getValues();
      
      var keysToUpdate = ['von_goc', 'risk_percent_mac_dinh'];
      for (var k = 0; k < keysToUpdate.length; k++) {
        var targetKey = keysToUpdate[k];
        if (configPatch.hasOwnProperty(targetKey)) {
          var newVal = configPatch[targetKey];
          var found = false;
          
          for (var r = 1; r < data.length; r++) {
            if (String(data[r][0]).trim() === customerId && String(data[r][1]).trim() === targetKey) {
              sheet.getRange(r + 1, 3).setValue(newVal);
              found = true;
              break;
            }
          }
          
          if (!found) {
            sheet.appendRow([customerId, targetKey, newVal, 'Cấu hình mặc định']);
          }
        }
      }
      
      lock.releaseLock();
      return { success: true };
    } catch (err) {
      lock.releaseLock();
      return { success: false, error: err.toString() };
    }
  },

  /**
   * 7. phanTichAnhChart(payload)
   * Uses Gemini Vision API (Model: gemini-1.5-flash via REST API)
   * @param {Object} payload { token: string, base64Image: string }
   * @returns {Object} { nhan_dinh: string }
   */
  phanTichAnhChart: function(payload) {
    try {
      var token = payload ? payload.token : null;
      var customerId = _xacThucToken(token);
      var base64Image = payload ? (payload.base64Image || payload.image) : '';
      
      var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
      if (!apiKey || apiKey.trim() === '') {
        return {
          success: true,
          nhan_dinh: '🤖 AI Vision Demo Mode (Chưa cấu hình GEMINI_API_KEY trong Script Properties):\n- Cấu trúc chart: Uptrend / Test Order Block\n- Đề xuất Entry: Gần cản H1\n- Gợi ý R:R: >= 1:2.5'
        };
      }
      
      // Clean base64 image prefix if present
      var cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
      
      // Call Gemini API (gemini-1.5-flash via v1beta REST)
      var apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;
      var prompt = 'Bạn là chuyên gia đọc nến & chart trading SMC/Price Action. Hãy phân tích ảnh biểu đồ này và trích xuất/đánh giá: 1. Cặp tiền & Cấu trúc xu hướng (Uptrend/Downtrend/Sideway) 2. Vùng Entry, Stop Loss, Take Profit khả thi 3. Tỷ lệ R:R dự kiến và lưu ý kỷ luật.';
      
      var bodyData = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/png',
                  data: cleanBase64
                }
              }
            ]
          }
        ]
      };
      
      var options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(bodyData),
        muteHttpExceptions: true
      };
      
      var response = UrlFetchApp.fetch(apiUrl, options);
      var resultJson = JSON.parse(response.getContentText());
      
      var nhanDinh = 'Không đọc được kết quả từ Gemini AI';
      if (resultJson && resultJson.candidates && resultJson.candidates.length > 0) {
        var candidate = resultJson.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          nhanDinh = candidate.content.parts[0].text;
        }
      }
      
      return { success: true, nhan_dinh: nhanDinh };
    } catch (err) {
      return { success: false, error: 'Lỗi gọi AI Vision: ' + err.toString() };
    }
  }

};
