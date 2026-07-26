/**
 * Factory OS — Product #25: TradingOS (v2 Multi-Tenant SaaS)
 * Standard #4 & #6 compliant Apps Script API Router.
 * Uses ContentService to serve JSON endpoints exclusively.
 */

function doGet(e) {
  try {
    var params = e ? e.parameter || {} : {};
    var action = params.action;
    
    if (!action || !Api[action]) {
      return _jsonResponse({ success: false, error: 'Action không hợp lệ hoặc thiếu parameter: ' + action });
    }
    
    var result = Api[action](params);
    return _jsonResponse(result);
  } catch (err) {
    return _jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    
    var action = body.action || (e ? e.parameter.action : null);
    var payload = body.payload || body;
    
    if (!action || !Api[action]) {
      return _jsonResponse({ success: false, error: 'Action không hợp lệ: ' + action });
    }
    
    var result = Api[action](payload);
    return _jsonResponse(result);
  } catch (err) {
    return _jsonResponse({ success: false, error: err.toString() });
  }
}

function _jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
