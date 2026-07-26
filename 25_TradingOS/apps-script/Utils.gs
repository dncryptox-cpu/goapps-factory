/**
 * Factory OS — Product #25: TradingOS (v2 Multi-Tenant SaaS)
 * Standard #4 & #6 compliant Utility Functions.
 */

var ACCOUNTS_SHEET_ID = '1TvsA7OldHNkApdqt7QPui3Wui17v2O-_o836OrOLgsk';
var TRADING_SHEET_ID = '1B8QkFekvKokZGWWs1vnA_FEB44Pz5ar28_C6u59GYIo';

/**
 * Access GoApps_Accounts USERS tab
 */
function _getAccountsSheet() {
  var ss = SpreadsheetApp.openById(ACCOUNTS_SHEET_ID);
  var sheet = ss.getSheetByName('USERS');
  if (!sheet) {
    throw new Error('Không tìm thấy tab USERS trong Sheet GoApps_Accounts');
  }
  return sheet;
}

/**
 * Access 25_TradingOS DATA or CONFIG tab
 */
function _getTradingSheet(tabName) {
  var ss = SpreadsheetApp.openById(TRADING_SHEET_ID);
  var sheet = ss.getSheetByName(tabName || 'DATA');
  if (!sheet) {
    throw new Error('Không tìm thấy tab ' + tabName + ' trong Sheet 25_TradingOS');
  }
  return sheet;
}

/**
 * LockService wrapper for Standard #6
 */
function _getLock() {
  var lock = LockService.getScriptLock();
  var success = lock.waitLock(10000); // 10 seconds
  if (!success) {
    throw new Error('Hệ thống bận, vui lòng thử lại sau giây lát (Lock timeout)');
  }
  return lock;
}

/**
 * Password Hashing (SHA-256)
 */
function _hashPassword(password) {
  if (!password) return '';
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  var txtHash = '';
  for (var i = 0; i < rawHash.length; i++) {
    var byte = rawHash[i];
    if (byte < 0) byte += 256;
    var byteStr = byte.toString(16);
    if (byteStr.length === 1) byteStr = '0' + byteStr;
    txtHash += byteStr;
  }
  return txtHash;
}

/**
 * Generate Token for authenticated session (Standard #6)
 */
function _taoToken(customerId) {
  var randomId = Utilities.getUuid().substring(0, 8).toUpperCase();
  var token = 'TOK_' + customerId + '_' + new Date().getTime() + '_' + randomId;
  
  // Cache token in ScriptCache for 6 hours (21600s)
  var cache = CacheService.getScriptCache();
  cache.put(token, customerId, 21600);
  
  return token;
}

/**
 * Validate Token and return associated customer_id (Standard #6)
 */
function _xacThucToken(token) {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    throw new Error('Yêu cầu token xác thực. Vui lòng đăng nhập.');
  }
  
  var cleanToken = token.trim();
  var cache = CacheService.getScriptCache();
  var customerId = cache.get(cleanToken);
  
  // Fallback: parse customer_id directly if token matches TOK_<customerId>_<timestamp>_<hash>
  if (!customerId && cleanToken.indexOf('TOK_') === 0) {
    var parts = cleanToken.split('_');
    if (parts.length >= 4) {
      customerId = parts[1];
      // Re-cache for convenience
      cache.put(cleanToken, customerId, 21600);
    }
  }
  
  if (!customerId) {
    throw new Error('Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
  }
  
  return customerId;
}

/**
 * Generate unique Trade ID (e.g., TRD-8819A20F)
 */
function _generateTradeId() {
  return 'TRD-' + Utilities.getUuid().substring(0, 8).toUpperCase();
}

/**
 * Convert Sheet data rows into JSON Objects array using header row
 */
function _sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var results = [];
  
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    // Skip completely empty rows
    if (!row || row.join('').trim() === '') continue;
    
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var key = String(headers[c]).trim();
      if (key) {
        obj[key] = row[c];
      }
    }
    results.push(obj);
  }
  
  return results;
}
