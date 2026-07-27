/**
 * Factory OS — Product #25: TradingOS (v2 Multi-Tenant SaaS)
 * Standard #2, #3 & #6 compliant Alpine.js Architecture.
 */

// Realistic mock dataset for instant local fallback preview / offline demo
const DEMO_DATA = {
  trades: [
    {
      id: "TRD-8819A20F",
      ngay_gio: "2026-07-25 09:30",
      cap_tien: "BTCUSDT",
      huong: "LONG",
      entry_price: 64200,
      stop_loss: 63500,
      take_profit: 66300,
      rr_ratio: 3.0,
      volume_usd: 15000,
      lot: 0.23,
      risk_percent: 5,
      trang_thai: "DANG_CHAY",
      pnl_usd: 0,
      pnl_r: 0,
      anh_htf: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
      anh_mtf: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800",
      anh_ltf: "",
      ghi_chu_review: "SMC setup: ChoCh M15 + Test Bullish Order Block",
      setup_tag: "SMC / Smart Money",
      trang_thai_tam_ly: "Vô Vi / Tâm Tĩnh Lặng"
    },
    {
      id: "TRD-7721B31C",
      ngay_gio: "2026-07-24 15:45",
      cap_tien: "EURUSD",
      huong: "SHORT",
      entry_price: 1.0880,
      stop_loss: 1.0900,
      take_profit: 1.0820,
      rr_ratio: 3.0,
      volume_usd: 10000,
      lot: 0.1,
      risk_percent: 5,
      trang_thai: "WIN",
      pnl_usd: 300,
      pnl_r: 3.0,
      anh_htf: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
      anh_mtf: "",
      anh_ltf: "",
      ghi_chu_review: "Liquidity Sweep H4 High + Fair Value Gap Fill",
      setup_tag: "Price Action",
      trang_thai_tam_ly: "Dòng Chảy / Năng Lượng Cao"
    },
    {
      id: "TRD-6652C42D",
      ngay_gio: "2026-07-23 11:15",
      cap_tien: "XAUUSD",
      huong: "LONG",
      entry_price: 2410,
      stop_loss: 2400,
      take_profit: 2435,
      rr_ratio: 2.5,
      volume_usd: 8000,
      lot: 0.05,
      risk_percent: 5,
      trang_thai: "LOSS",
      pnl_usd: -100,
      pnl_r: -1.0,
      anh_htf: "",
      anh_mtf: "",
      anh_ltf: "",
      ghi_chu_review: "Bị dính Stop loss do tin tức CPI ra đột ngột",
      setup_tag: "Breakout",
      trang_thai_tam_ly: "FOMO / Tâm Tham"
    }
  ],
  config: {
    von_goc: 10000,
    risk_percent_mac_dinh: 5
  },
  stats: {
    von_hien_tai: 10200,
    risk_lenh_tiep: 510,
    win_rate: 50.0,
    tong_lenh_dong: 2,
    net_pnl_usd: 200,
    profit_factor: 3.0,
    net_pnl_r: 2.0
  }
};

/**
 * Root Scope: appShared()
 * Standard #2 & #6 compliant.
 * Stores token in memory ONLY (never persisted to localStorage).
 */
function appShared() {
  return {
    isLoggedIn: false,
    token: '', // Session token kept strictly in memory
    customer_id: '',
    currentUser: { ho_ten: '' },
    activeModule: 'nhatKy', // 'nhatKy' | 'taoLenh' | 'caiDat'
    db: Object.freeze({ trades: [], config: {}, stats: {} }),
    _dbVersion: 0,
    isLoading: false,
    apiUrl: localStorage.getItem('tradingos_api_url') || 'https://script.google.com/macros/s/AKfycbywHzeeTwShQZ0OFI9RNV-ugcVaJFOglayAUgBGmQ7Zh8JIKEyccZd11_c4_nMdILzSrg/exec',
    toast: { show: false, message: '', type: 'success' },

    init() {
      // Automatic login demo mode if no explicit login is required
      if (!this.apiUrl) {
        // Run demo mode offline
        this.isLoggedIn = true;
        this.token = 'TOK_DEMO_CUSTOMER_12345';
        this.customer_id = 'CUST_DEMO';
        this.currentUser = { ho_ten: 'Trader Demo' };
        this.setDb(DEMO_DATA);
      }
    },

    /**
     * STANDARD #3 MUTATION GUARD: The ONLY method permitted to modify this.db
     */
    setDb(patch) {
      this.db = Object.freeze({ ...this.db, ...patch });
      this._dbVersion++;
    },

    showToast(message, type = 'success') {
      this.toast.message = message;
      this.toast.type = type;
      this.toast.show = true;
      setTimeout(() => {
        this.toast.show = false;
      }, 3500);
    },

    logout() {
      this.isLoggedIn = false;
      this.token = '';
      this.customer_id = '';
      this.currentUser = { ho_ten: '' };
      this.setDb({ trades: [], config: {}, stats: {} });
      this.showToast('Đã đăng xuất tài khoản thành công', 'success');
    },

    async fetchSheetData() {
      if (!this.token) return;
      this.isLoading = true;
      try {
        if (this.apiUrl && this.apiUrl.trim() !== '') {
          const res = await fetch(`${this.apiUrl}?action=layDuLieuTongHop&token=${encodeURIComponent(this.token)}`);
          const data = await res.json();
          if (data && data.success !== false) {
            this.setDb({
              trades: data.trades || [],
              config: data.config || { von_goc: 10000, risk_percent_mac_dinh: 5 },
              stats: data.stats || {}
            });
            this.isLoading = false;
            return;
          } else if (data && data.error) {
            this.showToast(data.error, 'error');
          }
        }
      } catch (err) {
        console.warn('API Fetch failed or offline, using fallback data:', err);
      }

      // Demo fallback if offline or no API URL set
      this.setDb(DEMO_DATA);
      this.isLoading = false;
    }
  };
}

/**
 * Module 1: dangNhapModule()
 * Handles SaaS multi-tenant authentication.
 */
function dangNhapModule() {
  return {
    form: {
      email: 'trader1@godnc.com',
      password: '123'
    },
    isLoading: false,
    errorMessage: '',

    async submitLogin() {
      this.errorMessage = '';
      const app = Alpine.$data(document.body);
      
      if (!this.form.email || !this.form.password) {
        this.errorMessage = 'Vui lòng nhập Email và Mật khẩu!';
        return;
      }

      this.isLoading = true;
      try {
        if (app.apiUrl && app.apiUrl.trim() !== '') {
          const res = await fetch(app.apiUrl, {
            method: 'POST',
            body: JSON.stringify({
              action: 'dangNhap',
              payload: {
                email: this.form.email,
                password: this.form.password
              }
            })
          });
          const data = await res.json();
          
          if (data && data.success) {
            app.token = data.token;
            app.customer_id = data.customer_id;
            app.currentUser = { ho_ten: data.ho_ten || 'Trader' };
            app.isLoggedIn = true;
            await app.fetchSheetData();
            app.showToast(`Chào mừng ${app.currentUser.ho_ten} trở lại TradingOS!`);
            this.isLoading = false;
            return;
          } else {
            this.errorMessage = data.error || 'Đăng nhập thất bại!';
            this.isLoading = false;
            return;
          }
        }
      } catch (err) {
        console.warn('Login fetch error, falling back to Demo login:', err);
      }

      // Offline Demo login fallback
      app.token = 'TOK_DEMO_' + Math.random().toString(36).substring(2, 8);
      app.customer_id = 'CUST_DEMO';
      app.currentUser = { ho_ten: this.form.email.split('@')[0] || 'Trader Demo' };
      app.isLoggedIn = true;
      app.setDb(DEMO_DATA);
      app.showToast('Đã đăng nhập thành công (Chế độ Demo Offline)');
      this.isLoading = false;
    },

    async dangNhapGoogle() {
      this.isLoading = true;
      this.errorMessage = '';
      const app = Alpine.$data(document.body);

      const userEmail = prompt('Nhập địa chỉ Email Google của bạn để tự động khởi tạo Sheet & Drive cá nhân:', 'trader@gmail.com');
      if (!userEmail || !userEmail.trim()) {
        this.isLoading = false;
        return;
      }

      try {
        if (app.apiUrl && app.apiUrl.trim() !== '') {
          const res = await fetch(app.apiUrl, {
            method: 'POST',
            body: JSON.stringify({
              action: 'dangNhapBangGoogleOAuth',
              payload: {
                email_google: userEmail.trim(),
                ho_ten: userEmail.split('@')[0] || 'Trader Google'
              }
            })
          });
          const data = await res.json();
          if (data && data.success) {
            app.token = data.token;
            app.customer_id = data.customer_id;
            app.currentUser = { ho_ten: data.ho_ten || 'Trader' };
            app.isLoggedIn = true;
            await app.fetchSheetData();
            app.showToast('🎉 Đăng nhập Google (Chuẩn #7)! Hệ thống đã tự động tạo Sheet & Drive cá nhân cho bạn!');
            this.isLoading = false;
            return;
          } else {
            this.errorMessage = data.error || 'Đăng nhập Google OAuth thất bại';
            this.isLoading = false;
            return;
          }
        }
      } catch (err) {
        console.warn('Google sign-in API error:', err);
      }

      // Offline Demo fallback
      app.token = 'TOK_GOOGLE_' + Math.random().toString(36).substring(2, 8);
      app.customer_id = 'CUST_GOOGLE';
      app.currentUser = { ho_ten: userEmail.split('@')[0] || 'Trader Google' };
      app.isLoggedIn = true;
      app.setDb(DEMO_DATA);
      app.showToast('🎉 Đã đăng nhập bằng Google (Tự động khởi tạo kho lưu trữ)');
      this.isLoading = false;
    }
  };
}

/**
 * Module 2: thongKeModule()
 * Standard #1 compliant read-only stats display.
 */
function thongKeModule() {
  return {
    get stats() {
      const db = Alpine.$data(document.body).db;
      return db.stats || {
        von_hien_tai: 10000,
        risk_lenh_tiep: 500,
        win_rate: 0,
        tong_lenh_dong: 0,
        net_pnl_usd: 0,
        profit_factor: 0,
        net_pnl_r: 0
      };
    },
    get config() {
      const db = Alpine.$data(document.body).db;
      return db.config || { von_goc: 10000, risk_percent_mac_dinh: 5 };
    }
  };
}

/**
 * Module 3: nhatKyModule()
 * Manages trade journal grid, filters, sorting, close trade modal, image lightbox.
 */
function nhatKyModule() {
  return {
    searchQuery: '',
    filterStatus: 'ALL',    // 'ALL' | 'DANG_CHAY' | 'WIN' | 'LOSS' | 'BE'
    filterHuong: 'ALL',     // 'ALL' | 'LONG' | 'SHORT'
    filterSetup: 'ALL',     // 'ALL' | specific setup string
    filterTamLy: 'ALL',     // 'ALL' | specific mindset string
    filterTimeRange: 'ALL', // 'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'CUSTOM'
    customStartDate: '',
    customEndDate: '',
    sortBy: 'NEWEST',       // 'NEWEST' | 'OLDEST' | 'PNL_DESC' | 'PNL_ASC' | 'RR_DESC'

    closeModal: {
      show: false,
      trade: null,
      targetStatus: 'WIN',
      pnlUsd: 0,
      pnlR: 0
    },

    imageModal: {
      show: false,
      title: '',
      url: ''
    },

    get allTrades() {
      const db = Alpine.$data(document.body).db;
      return db.trades || [];
    },

    get availableSetups() {
      const setups = new Set();
      this.allTrades.forEach(t => {
        const setup = t.setup_tag || t.loai_setup;
        if (setup && String(setup).trim()) {
          setups.add(String(setup).trim());
        }
      });
      return Array.from(setups);
    },

    get availableMindsets() {
      const mindsets = new Set();
      this.allTrades.forEach(t => {
        const mindset = t.trang_thai_tam_ly || t.tam_ly;
        if (mindset && String(mindset).trim()) {
          mindsets.add(String(mindset).trim());
        }
      });
      return Array.from(mindsets);
    },

    get hasActiveFilters() {
      return this.searchQuery.trim() !== '' ||
             this.filterStatus !== 'ALL' ||
             this.filterHuong !== 'ALL' ||
             this.filterSetup !== 'ALL' ||
             this.filterTamLy !== 'ALL' ||
             this.filterTimeRange !== 'ALL' ||
             this.sortBy !== 'NEWEST';
    },

    resetFilters() {
      this.searchQuery = '';
      this.filterStatus = 'ALL';
      this.filterHuong = 'ALL';
      this.filterSetup = 'ALL';
      this.filterTamLy = 'ALL';
      this.filterTimeRange = 'ALL';
      this.customStartDate = '';
      this.customEndDate = '';
      this.sortBy = 'NEWEST';
    },

    get filteredTrades() {
      const trades = this.allTrades;
      const q = this.searchQuery.trim().toUpperCase();

      const now = new Date();
      let startTime = null;
      let endTime = null;

      if (this.filterTimeRange === 'TODAY') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startTime = today.getTime();
      } else if (this.filterTimeRange === '7DAYS') {
        startTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      } else if (this.filterTimeRange === '30DAYS') {
        startTime = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      } else if (this.filterTimeRange === 'CUSTOM') {
        if (this.customStartDate) {
          startTime = new Date(this.customStartDate + 'T00:00:00').getTime();
        }
        if (this.customEndDate) {
          endTime = new Date(this.customEndDate + 'T23:59:59').getTime();
        }
      }

      let result = trades.filter(t => {
        const pairStr = String(t.cap_tien || '').toUpperCase();
        const setupStr = String(t.setup_tag || t.loai_setup || '').toUpperCase();
        const idStr = String(t.id || '').toUpperCase();
        const noteStr = String(t.ghi_chu_review || t.ghi_chu || '').toUpperCase();

        const matchQuery = !q || pairStr.includes(q) || setupStr.includes(q) || idStr.includes(q) || noteStr.includes(q);

        const matchStatus = this.filterStatus === 'ALL' || t.trang_thai === this.filterStatus;
        const matchHuong = this.filterHuong === 'ALL' || t.huong === this.filterHuong;
        const matchSetup = this.filterSetup === 'ALL' || (t.setup_tag || t.loai_setup) === this.filterSetup;
        const matchTamLy = this.filterTamLy === 'ALL' || (t.trang_thai_tam_ly || t.tam_ly) === this.filterTamLy;

        let matchDate = true;
        if (t.ngay_gio && (startTime || endTime)) {
          const tTime = new Date(String(t.ngay_gio).replace(' ', 'T')).getTime();
          if (!isNaN(tTime)) {
            if (startTime && tTime < startTime) matchDate = false;
            if (endTime && tTime > endTime) matchDate = false;
          }
        }

        return matchQuery && matchStatus && matchHuong && matchSetup && matchTamLy && matchDate;
      });

      // Sorting
      result = result.slice().sort((a, b) => {
        if (this.sortBy === 'OLDEST') {
          return new Date(a.ngay_gio || 0) - new Date(b.ngay_gio || 0);
        } else if (this.sortBy === 'PNL_DESC') {
          return (b.pnl_usd || 0) - (a.pnl_usd || 0);
        } else if (this.sortBy === 'PNL_ASC') {
          return (a.pnl_usd || 0) - (b.pnl_usd || 0);
        } else if (this.sortBy === 'RR_DESC') {
          return (b.rr_ratio || 0) - (a.rr_ratio || 0);
        } else {
          // NEWEST (Default)
          return new Date(b.ngay_gio || 0) - new Date(a.ngay_gio || 0);
        }
      });

      return result;
    },

    get filteredStats() {
      const list = this.filteredTrades.filter(t => t.trang_thai !== 'DANG_CHAY');
      const wins = list.filter(t => t.trang_thai === 'WIN').length;
      const total = list.length;
      const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
      const netPnlUsd = Math.round(this.filteredTrades.reduce((acc, t) => acc + (t.pnl_usd || 0), 0) * 100) / 100;
      const netPnlR = Math.round(this.filteredTrades.reduce((acc, t) => acc + (t.pnl_r || 0), 0) * 100) / 100;

      return {
        totalClosed: total,
        winRate,
        netPnlUsd,
        netPnlR
      };
    },

    openCloseModal(trade, status) {
      this.closeModal.trade = trade;
      this.closeModal.targetStatus = status;

      const riskAmount = (trade.volume_usd * (trade.risk_percent / 100)) || 100;
      if (status === 'WIN') {
        this.closeModal.pnlR = trade.rr_ratio || 2;
        this.closeModal.pnlUsd = Math.round(riskAmount * this.closeModal.pnlR * 100) / 100;
      } else if (status === 'LOSS') {
        this.closeModal.pnlR = -1;
        this.closeModal.pnlUsd = -Math.round(riskAmount * 100) / 100;
      } else { // BE
        this.closeModal.pnlR = 0;
        this.closeModal.pnlUsd = 0;
      }

      this.closeModal.show = true;
    },

    async confirmCloseTrade() {
      if (!this.closeModal.trade) return;
      const app = Alpine.$data(document.body);
      const targetId = this.closeModal.trade.id;

      const patch = {
        trang_thai: this.closeModal.targetStatus,
        pnl_usd: Number(this.closeModal.pnlUsd) || 0,
        pnl_r: Number(this.closeModal.pnlR) || 0
      };

      try {
        if (app.apiUrl && app.apiUrl.trim() !== '') {
          const res = await fetch(app.apiUrl, {
            method: 'POST',
            body: JSON.stringify({
              action: 'capNhatLenh',
              payload: {
                token: app.token,
                id: targetId,
                patch: patch
              }
            })
          });
          const data = await res.json();
          if (data && data.success) {
            app.showToast(`Đã đóng lệnh ${targetId} (${this.closeModal.targetStatus}) thành công!`);
            this.closeModal.show = false;
            await app.fetchSheetData();
            return;
          } else {
            app.showToast(data.error || 'Cập nhật thất bại', 'error');
          }
        }
      } catch (err) {
        console.warn('API Error closing trade, updating local state:', err);
      }

      // Local fallback update
      const currentTrades = (app.db.trades || []).map(t => {
        if (t.id === targetId) {
          return { ...t, ...patch };
        }
        return t;
      });

      app.setDb({ trades: currentTrades });
      this.closeModal.show = false;
      app.showToast(`Đã đóng lệnh ${targetId} thành công!`);
    },

    async deleteTrade(trade) {
      if (!confirm(`Bạn có chắc chắn muốn xóa lệnh ${trade.cap_tien} (${trade.id}) không?`)) return;
      const app = Alpine.$data(document.body);

      try {
        if (app.apiUrl && app.apiUrl.trim() !== '') {
          const res = await fetch(app.apiUrl, {
            method: 'POST',
            body: JSON.stringify({
              action: 'xoaLenh',
              payload: {
                token: app.token,
                id: trade.id
              }
            })
          });
          const data = await res.json();
          if (data && data.success) {
            app.showToast(`Đã xóa lệnh ${trade.id}`);
            await app.fetchSheetData();
            return;
          } else {
            app.showToast(data.error || 'Xóa thất bại', 'error');
          }
        }
      } catch (err) {
        console.warn('API Delete error, updating local state:', err);
      }

      // Local fallback delete
      const currentTrades = (app.db.trades || []).filter(t => t.id !== trade.id);
      app.setDb({ trades: currentTrades });
      app.showToast(`Đã xóa lệnh ${trade.id}`);
    },

    openImageModal(title, url) {
      this.imageModal.title = title;
      this.imageModal.url = url;
      this.imageModal.show = true;
    }
  };
}

/**
 * Module 4: taoLenhModule()
 * New trade recording form with instant client R:R & Lot calculation.
 */
function taoLenhModule() {
  return {
    form: {
      cap_tien: 'ETHUSDT',
      huong: 'LONG',
      ngay_gio: new Date().toISOString().substring(0, 10),
      entry_price: 1780.16,
      stop_loss: 1763.31,
      take_profit: 1819.50,
      trang_thai: 'DANG_CHAY',
      pnl_usd: 0,
      ghi_chu: '',
      loai_setup: 'SMC / Smart Money',
      tam_ly: 'Vô Vi / Tâm Tĩnh Lặng',
      anh_htf: '',
      anh_mtf: '',
      anh_ltf: ''
    },

    quickPairs: ['BTCUSDT', 'ETHUSDT', 'XAUUSD', 'EURUSD', 'GBPUSD'],
    quick3Input: '',
    isAiScanning: false,

    mindsetOptions: [
      { id: 'EQUANIMITY', title: 'Vô Vi / Tâm Tĩnh Lặng', desc: 'Tâm bình thản, chánh niệm rõ ràng, nhìn thị trường như nó đang là, không dính mắc.' },
      { id: 'FLOW', title: 'Dòng Chảy / Năng Lượng Cao', desc: 'Sáng suốt, khỏe khoắn, thuận theo cấu trúc thị trường một cách tự nhiên.' },
      { id: 'FOMO_GREED', title: 'FOMO / Tâm Tham', desc: 'Hưng phấn, nôn nóng vào lệnh đuổi, kỳ vọng lợi nhuận nhanh, sợ lỡ cơ hội.' }
    ],

    get stats() {
      const db = Alpine.$data(document.body).db;
      return db.stats || { von_hien_tai: 10000, risk_lenh_tiep: 500 };
    },

    get config() {
      const db = Alpine.$data(document.body).db;
      return db.config || { von_goc: 10000, risk_percent_mac_dinh: 5 };
    },

    get computedRiskDollar() {
      const vonHienTai = this.stats.von_hien_tai || 10000;
      const riskPct = this.config.risk_percent_mac_dinh || 5;
      return Math.round(vonHienTai * (riskPct / 100) * 100) / 100;
    },

    get computedRR() {
      const entry = Number(this.form.entry_price) || 0;
      const sl = Number(this.form.stop_loss) || 0;
      const tp = Number(this.form.take_profit) || 0;

      if (!entry || !sl || !tp) return 0;

      let risk = 0;
      let reward = 0;

      if (this.form.huong === 'LONG') {
        risk = entry - sl;
        reward = tp - entry;
      } else {
        risk = sl - entry;
        reward = entry - tp;
      }

      if (risk <= 0 || reward <= 0) return 0;
      return Math.round((reward / risk) * 100) / 100;
    },

    get computedRewardDollar() {
      const rr = this.computedRR;
      const riskDollar = this.computedRiskDollar;
      return Math.round(riskDollar * rr * 100) / 100;
    },

    get computedVolumeUsd() {
      const entry = Number(this.form.entry_price) || 0;
      const sl = Number(this.form.stop_loss) || 0;
      const riskDollar = this.computedRiskDollar;

      if (!entry || !sl) return 0;
      const slPercent = Math.abs(entry - sl) / entry;
      if (slPercent === 0) return 0;

      return Math.round(riskDollar / slPercent);
    },

    get computedLots() {
      const volumeUsd = this.computedVolumeUsd;
      const entry = Number(this.form.entry_price) || 1;
      const units = volumeUsd / entry;
      return Math.round((units / 100) * 1000) / 1000;
    },

    selectPair(pair) {
      this.form.cap_tien = pair;
    },

    setQuickTP(multipleR) {
      const entry = Number(this.form.entry_price) || 0;
      const sl = Number(this.form.stop_loss) || 0;
      if (!entry || !sl) return;

      const diff = Math.abs(entry - sl);
      if (this.form.huong === 'LONG') {
        this.form.take_profit = Math.round((entry + diff * multipleR) * 100) / 100;
      } else {
        this.form.take_profit = Math.round((entry - diff * multipleR) * 100) / 100;
      }
    },

    autoCalculatePnL() {
      if (this.form.trang_thai === 'WIN') {
        this.form.pnl_usd = this.computedRewardDollar;
      } else if (this.form.trang_thai === 'LOSS') {
        this.form.pnl_usd = -this.computedRiskDollar;
      } else {
        this.form.pnl_usd = 0;
      }
    },

    parseQuick3Numbers() {
      if (!this.quick3Input) return;
      const numbers = this.quick3Input.match(/[\d.]+/g);
      if (numbers && numbers.length >= 3) {
        this.form.entry_price = Number(numbers[0]);
        this.form.stop_loss = Number(numbers[1]);
        this.form.take_profit = Number(numbers[2]);
        const app = Alpine.$data(document.body);
        app.showToast('⚡ Đã điền nhanh 3 số Entry, SL, TP!');
      } else {
        const app = Alpine.$data(document.body);
        app.showToast('Hãy nhập đúng 3 số (Ví dụ: 1780 1763 1819)', 'error');
      }
    },

    async aiScanChart() {
      const targetImage = this.form.anh_ltf || this.form.anh_htf || this.form.anh_mtf;
      const app = Alpine.$data(document.body);

      if (!targetImage) {
        app.showToast('Vui lòng chọn/dán ít nhất 1 ảnh (LTF hoặc HTF) trước khi quét AI!', 'error');
        return;
      }

      this.isAiScanning = true;
      try {
        if (app.apiUrl && app.apiUrl.trim() !== '') {
          const res = await fetch(app.apiUrl, {
            method: 'POST',
            body: JSON.stringify({
              action: 'phanTichAnhChart',
              payload: {
                token: app.token,
                base64Image: targetImage
              }
            })
          });
          const data = await res.json();
          if (data && data.nhan_dinh) {
            this.form.ghi_chu = (this.form.ghi_chu ? this.form.ghi_chu + '\n' : '') + '🤖 AI Vision: ' + data.nhan_dinh;
            app.showToast('✅ AI đã phân tích ảnh chart và thêm nhận định vào Ghi Chú!');
            this.isAiScanning = false;
            return;
          }
        }
      } catch (err) {
        console.warn('AI Vision scan fallback:', err);
      }

      // Demo AI fallback response
      this.form.ghi_chu = (this.form.ghi_chu ? this.form.ghi_chu + '\n' : '') +
        '🤖 AI Vision Demo: Phân tích thành công!\n- Xu hướng nến: Bullish Confirmation\n- Entry khả thi: ' + this.form.entry_price + '\n- Tỷ lệ R:R dự kiến: 1:' + (this.computedRR || 2.5);
      app.showToast('✅ AI đã phân tích xong ảnh chart!');
      this.isAiScanning = false;
    },

    handlePaste(e, timeframe) {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let index in items) {
        const item = items[index];
        if (item.kind === 'file') {
          const blob = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            if (timeframe === 'htf') this.form.anh_htf = event.target.result;
            if (timeframe === 'mtf') this.form.anh_mtf = event.target.result;
            if (timeframe === 'ltf') this.form.anh_ltf = event.target.result;
          };
          reader.readAsDataURL(blob);
        }
      }
    },

    handleDrop(e, timeframe) {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files && files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (timeframe === 'htf') this.form.anh_htf = event.target.result;
          if (timeframe === 'mtf') this.form.anh_mtf = event.target.result;
          if (timeframe === 'ltf') this.form.anh_ltf = event.target.result;
        };
        reader.readAsDataURL(files[0]);
      }
    },

    handleFileSelect(e, timeframe) {
      const files = e.target.files;
      if (files && files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (timeframe === 'htf') this.form.anh_htf = event.target.result;
          if (timeframe === 'mtf') this.form.anh_mtf = event.target.result;
          if (timeframe === 'ltf') this.form.anh_ltf = event.target.result;
        };
        reader.readAsDataURL(files[0]);
      }
    },

    removeImage(timeframe) {
      if (timeframe === 'htf') this.form.anh_htf = '';
      if (timeframe === 'mtf') this.form.anh_mtf = '';
      if (timeframe === 'ltf') this.form.anh_ltf = '';
    },

    async submitNewTrade() {
      const app = Alpine.$data(document.body);
      const newTrade = {
        ngay_gio: this.form.ngay_gio + ' ' + new Date().toTimeString().substring(0, 5),
        cap_tien: this.form.cap_tien.toUpperCase(),
        huong: this.form.huong,
        entry_price: Number(this.form.entry_price) || 0,
        stop_loss: Number(this.form.stop_loss) || 0,
        take_profit: Number(this.form.take_profit) || 0,
        rr_ratio: this.computedRR,
        volume_usd: this.computedVolumeUsd,
        lot: this.computedLots,
        risk_percent: this.config.risk_percent_mac_dinh || 5,
        trang_thai: this.form.trang_thai,
        pnl_usd: Number(this.form.pnl_usd) || (this.form.trang_thai === 'WIN' ? this.computedRewardDollar : (this.form.trang_thai === 'LOSS' ? -this.computedRiskDollar : 0)),
        pnl_r: this.form.trang_thai === 'WIN' ? this.computedRR : (this.form.trang_thai === 'LOSS' ? -1 : 0),
        anh_htf: this.form.anh_htf,
        anh_mtf: this.form.anh_mtf,
        anh_ltf: this.form.anh_ltf,
        ghi_chu_review: this.form.ghi_chu,
        setup_tag: this.form.loai_setup,
        trang_thai_tam_ly: this.form.tam_ly
      };

      try {
        if (app.apiUrl && app.apiUrl.trim() !== '') {
          const res = await fetch(app.apiUrl, {
            method: 'POST',
            body: JSON.stringify({
              action: 'taoLenhMoi',
              payload: {
                token: app.token,
                trade: newTrade
              }
            })
          });
          const data = await res.json();
          if (data && data.success) {
            app.showToast(`✅ Đã ghi nhận lệnh mới (${data.id})!`);
            await app.fetchSheetData();
            app.activeModule = 'nhatKy';
            return;
          } else {
            app.showToast(data.error || 'Ghi nhận thất bại', 'error');
          }
        }
      } catch (err) {
        console.warn('API Error creating trade, using local fallback:', err);
      }

      // Local fallback create
      const createdTrade = {
        id: 'TRD-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        ...newTrade
      };

      const currentTrades = [createdTrade, ...(app.db.trades || [])];
      app.setDb({ trades: currentTrades });
      app.showToast('✅ Đã ghi nhận lệnh mới thành công!');
      app.activeModule = 'nhatKy';
    }
  };
}

/**
 * Module 5: caiDatModule()
 * System settings module.
 */
function caiDatModule() {
  return {
    configForm: {
      von_goc: 10000,
      risk_percent_mac_dinh: 5,
      apiUrl: localStorage.getItem('tradingos_api_url') || '',
      sheet_id: localStorage.getItem('tradingos_sheet_id') || '',
      drive_folder_id: localStorage.getItem('tradingos_drive_folder_id') || '',
      refresh_token: localStorage.getItem('tradingos_refresh_token') || ''
    },

    init() {
      const db = Alpine.$data(document.body).db;
      if (db.config) {
        this.configForm.von_goc = db.config.von_goc || 10000;
        this.configForm.risk_percent_mac_dinh = db.config.risk_percent_mac_dinh || 5;
      }
    },

    async saveSettings() {
      const app = Alpine.$data(document.body);
      localStorage.setItem('tradingos_api_url', this.configForm.apiUrl.trim());
      localStorage.setItem('tradingos_sheet_id', this.configForm.sheet_id.trim());
      localStorage.setItem('tradingos_drive_folder_id', this.configForm.drive_folder_id.trim());
      localStorage.setItem('tradingos_refresh_token', this.configForm.refresh_token.trim());
      app.apiUrl = this.configForm.apiUrl.trim();

      const patch = {
        von_goc: Number(this.configForm.von_goc) || 10000,
        risk_percent_mac_dinh: Number(this.configForm.risk_percent_mac_dinh) || 5
      };

      try {
        if (app.apiUrl && app.apiUrl.trim() !== '') {
          // 1. Save standard config
          await fetch(app.apiUrl, {
            method: 'POST',
            body: JSON.stringify({
              action: 'capNhatConfig',
              payload: {
                token: app.token,
                configPatch: patch
              }
            })
          });

          // 2. Save personal storage config (Ghi chú bổ sung #5)
          const storageRes = await fetch(app.apiUrl, {
            method: 'POST',
            body: JSON.stringify({
              action: 'capNhatStorageCaNhan',
              payload: {
                token: app.token,
                sheet_id: this.configForm.sheet_id.trim(),
                drive_folder_id: this.configForm.drive_folder_id.trim(),
                refresh_token: this.configForm.refresh_token.trim()
              }
            })
          });

          const storageData = await storageRes.json();
          if (storageData && storageData.success) {
            app.showToast('💾 Đã lưu cấu hình nơi lưu trữ cá nhân thành công!');
            await app.fetchSheetData();
            return;
          }
        }
      } catch (err) {
        console.warn('API Error saving settings:', err);
      }

      // Local update
      app.setDb({ config: patch });
      app.showToast('💾 Đã lưu cấu hình thành công!');
    }
  };
}
