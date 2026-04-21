// ============================================
// 日月潭低碳旅遊・集點資料設定
// ============================================

// 兌換獎勵（單一款：碳麵包）
const TIERS = [
  { id: 'tier-1', name: '碳麵包', points: 10, desc: '完成日月潭低碳旅程專屬兌換・不開放販售', icon: '🥖' }
];

// 四大類別（無遊程包套）
const CATEGORIES = {
  experience:    { label: '體驗型',   color: '#4ec2c2', icon: '🏄' },
  accommodation: { label: '旅宿業',   color: '#7b9acc', icon: '🏨' },
  restaurant:    { label: '餐廳類',   color: '#e89b5b', icon: '🍽️' },
  landmark:      { label: '景點類',   color: '#10b981', icon: '🏛️' }
};

// ============================================
// 地點資料
// 欄位說明：
//   id / name / category / points / co2 / icon / addr / lat / lng
//   verifyMethod    ─ 'qr'（掃店家 QR）或 'photo'（拍照 AI 辨識）
//   qrHint          ─ QR 掃碼提示（verifyMethod = qr 用）
//   photoHint       ─ 拍照提示（verifyMethod = photo 用）
//   keywords        ─ AI 影像辨識關鍵特徵（photo 用）
//
// 規則：
//   - 景點類 (landmark)：拍照 AI 辨識（現場無櫃檯可放 QR）
//   - 其他三類（體驗/旅宿/餐廳）：掃現場 QR Code（有店員把關更準確）
// ============================================
const LOCATIONS = [
  // 體驗型（QR 掃碼）
  { id: 'EXP-SUP',   name: '日月潭立槳 SUP',       category: 'experience',    points: 3, co2: 2.5, icon: '🏄',
    addr: '南投縣魚池鄉伊達邵碼頭',            lat: 23.8575, lng: 120.9222,
    verifyMethod: 'qr', qrHint: '請掃描業者櫃檯張貼的 QR Code' },
  { id: 'EXP-KAYAK', name: '獨木舟體驗',           category: 'experience',    points: 3, co2: 2.5, icon: '🛶',
    addr: '南投縣魚池鄉朝霧碼頭',              lat: 23.8716, lng: 120.9182,
    verifyMethod: 'qr', qrHint: '請掃描業者櫃檯張貼的 QR Code' },
  { id: 'EXP-BIKE',  name: '環潭電動單車',         category: 'experience',    points: 2, co2: 4.0, icon: '🚲',
    addr: '南投縣魚池鄉向山遊客中心旁',        lat: 23.8466, lng: 120.9082,
    verifyMethod: 'qr', qrHint: '請掃描租借站的 QR Code' },
  { id: 'EXP-CABLE', name: '日月潭纜車站',         category: 'experience',    points: 2, co2: 1.5, icon: '🚠',
    addr: '南投縣魚池鄉金天巷 180 號',         lat: 23.8747, lng: 120.9472,
    verifyMethod: 'qr', qrHint: '請掃描纜車站售票口的 QR Code' },
  { id: 'EXP-BOAT',  name: '電動遊湖船',           category: 'experience',    points: 2, co2: 2.0, icon: '⛵',
    addr: '南投縣魚池鄉水社碼頭',              lat: 23.8697, lng: 120.9108,
    verifyMethod: 'qr', qrHint: '請掃描船公司售票口的 QR Code' },

  // 旅宿業（QR 掃碼）
  { id: 'STAY-01',   name: '映涵渡假飯店',         category: 'accommodation', points: 5, co2: 3.0, icon: '🏨',
    addr: '南投縣魚池鄉水社村中興路 101 號',   lat: 23.8700, lng: 120.9110,
    verifyMethod: 'qr', qrHint: '請掃描飯店櫃檯的入住打卡 QR Code' },
  { id: 'STAY-02',   name: '日月行館',             category: 'accommodation', points: 5, co2: 3.0, icon: '🏨',
    addr: '南投縣魚池鄉涵碧半島中興路 139 號', lat: 23.8683, lng: 120.9086,
    verifyMethod: 'qr', qrHint: '請掃描飯店櫃檯的入住打卡 QR Code' },
  { id: 'STAY-03',   name: '朵麗絲的家民宿',       category: 'accommodation', points: 5, co2: 3.0, icon: '🏨',
    addr: '南投縣魚池鄉日月村水秀街 17 號',    lat: 23.8575, lng: 120.9225,
    verifyMethod: 'qr', qrHint: '請掃描民宿櫃檯的入住打卡 QR Code' },
  { id: 'STAY-04',   name: '向山行館',             category: 'accommodation', points: 5, co2: 3.0, icon: '🏨',
    addr: '南投縣魚池鄉中山路 599-1 號',       lat: 23.8470, lng: 120.9090,
    verifyMethod: 'qr', qrHint: '請掃描民宿櫃檯的入住打卡 QR Code' },

  // 餐廳類（QR 掃碼）
  { id: 'REST-YGPL', name: '魚光窯烤・埔里店',     category: 'restaurant',    points: 2, co2: 1.0, icon: '🥖',
    addr: '南投縣埔里鎮中山路一段',            lat: 23.9653, lng: 120.9689,
    verifyMethod: 'qr', qrHint: '請掃描門市結帳台的 QR Code' },
  { id: 'REST-YGYC', name: '魚光窯烤・魚池店',     category: 'restaurant',    points: 2, co2: 1.0, icon: '🥖',
    addr: '南投縣魚池鄉中山路 318 號',         lat: 23.8967, lng: 120.9453,
    verifyMethod: 'qr', qrHint: '請掃描門市結帳台的 QR Code' },
  { id: 'REST-YM',   name: '遊牧咖啡',             category: 'restaurant',    points: 1, co2: 0.8, icon: '☕',
    addr: '南投縣魚池鄉中山路 450 號',         lat: 23.8933, lng: 120.9417,
    verifyMethod: 'qr', qrHint: '請掃描店內桌卡 QR Code' },
  { id: 'REST-XDY',  name: '先得月餐廳',           category: 'restaurant',    points: 2, co2: 1.5, icon: '🍽️',
    addr: '南投縣魚池鄉水社村中山路 112 號',   lat: 23.8700, lng: 120.9100,
    verifyMethod: 'qr', qrHint: '請掃描店內桌卡 QR Code' },

  // 景點類（拍照 AI 辨識）
  { id: 'LAND-XS',   name: '向山遊客中心',         category: 'landmark',      points: 2, co2: 0.5, icon: '🏛️',
    addr: '南投縣魚池鄉中山路 599 號',         lat: 23.8466, lng: 120.9082,
    verifyMethod: 'photo', photoHint: '請拍攝清水模建築與開放式廊道', keywords: ['向山', '遊客中心', '清水模', '建築'] },
  { id: 'LAND-WW',   name: '文武廟',               category: 'landmark',      points: 1, co2: 0.5, icon: '⛩️',
    addr: '南投縣魚池鄉中正路 63 號',          lat: 23.8783, lng: 120.9194,
    verifyMethod: 'photo', photoHint: '請拍攝文武廟牌樓或大殿', keywords: ['文武廟', '牌樓', '廟宇', '紅色'] },
  { id: 'LAND-CE',   name: '慈恩塔',               category: 'landmark',      points: 1, co2: 0.5, icon: '🗼',
    addr: '南投縣魚池鄉中正路慈恩塔步道',      lat: 23.8472, lng: 120.9306,
    verifyMethod: 'photo', photoHint: '請拍攝慈恩塔塔身或塔頂視野', keywords: ['慈恩塔', '塔', '八角'] }
];

// 最大可能點數（全部打卡）
const MAX_POINTS = LOCATIONS.reduce((s, l) => s + l.points, 0);

// ============================================
// LocalStorage 資料層
// ============================================
const DB = {
  _key: 'bread_points_v2',  // 升版重置舊資料

  load() {
    const raw = localStorage.getItem(this._key);
    if (raw) return JSON.parse(raw);
    return {
      userId: 'U' + Math.random().toString(36).slice(2, 10),
      displayName: '日月潭旅人',
      onboarded: false,
      checkIns: [],     // { locationId, timestamp, points, co2, method, photoPreview }
      redeemed: []      // { tierId, timestamp, code, used, usedAt }
    };
  },

  save(state) { localStorage.setItem(this._key, JSON.stringify(state)); },
  reset() { localStorage.removeItem(this._key); },

  getBalance(state) {
    const earned = state.checkIns.reduce((s, c) => s + c.points, 0);
    const spent = state.redeemed.reduce((s, r) => {
      const tier = TIERS.find(t => t.id === r.tierId);
      return s + (tier ? tier.points : 0);
    }, 0);
    return { earned, spent, balance: earned - spent };
  },

  getCO2(state) { return state.checkIns.reduce((s, c) => s + c.co2, 0); },

  hasCheckedIn(state, locationId) {
    return state.checkIns.some(c => c.locationId === locationId);
  },

  checkIn(state, location, photoDataUrl = null) {
    if (this.hasCheckedIn(state, location.id)) {
      return { ok: false, msg: '此地點已打卡過' };
    }
    state.checkIns.push({
      locationId: location.id,
      timestamp: Date.now(),
      points: location.points,
      co2: location.co2,
      method: photoDataUrl ? 'photo' : 'manual',
      photoPreview: photoDataUrl ? photoDataUrl.substring(0, 50) + '...' : null
    });
    this.save(state);
    return { ok: true, msg: `+${location.points} 點・減碳 ${location.co2} kg` };
  },

  redeem(state, tier) {
    const { balance } = this.getBalance(state);
    if (balance < tier.points) {
      return { ok: false, msg: `點數不足，還差 ${tier.points - balance} 點` };
    }
    const code = 'BR' + Date.now().toString().slice(-6);
    state.redeemed.push({ tierId: tier.id, timestamp: Date.now(), code, used: false, usedAt: null });
    this.save(state);
    return { ok: true, code };
  },

  // ============================================
  // QR 掃碼驗證
  // QR 內容格式：checkin:LOCATION_ID（例如 checkin:EXP-SUP）
  // 或直接是網址 https://domain/?checkin=LOCATION_ID
  // ============================================
  verifyQR(location, qrContent) {
    if (!qrContent) return { ok: false, msg: 'QR Code 內容為空' };

    // 解析 QR Code 內容
    let scannedId = null;
    const trimmed = qrContent.trim();
    if (trimmed.startsWith('checkin:')) {
      scannedId = trimmed.replace('checkin:', '').trim().toUpperCase();
    } else if (trimmed.includes('checkin=')) {
      const match = trimmed.match(/checkin=([A-Z0-9-]+)/i);
      if (match) scannedId = match[1].toUpperCase();
    } else {
      // 直接把內容當作 ID
      scannedId = trimmed.toUpperCase();
    }

    if (scannedId !== location.id) {
      return {
        ok: false,
        scannedId,
        msg: `此 QR Code 屬於「${scannedId}」，不是「${location.name}」的打卡碼`
      };
    }

    return { ok: true, scannedId, msg: `已驗證「${location.name}」的打卡碼` };
  },

  // ============================================
  // AI 照片辨識（模擬）
  // 正式環境：串接 Google Vision API / Claude Vision / 自訓練模型
  // ============================================
  async verifyPhoto(location, photoFile) {
    return new Promise((resolve) => {
      const delay = 1500 + Math.random() * 1000;
      setTimeout(() => {
        const hasContent = photoFile && photoFile.size > 10 * 1024;
        if (!hasContent) {
          resolve({ ok: false, confidence: 0, detected: [], msg: '照片品質不足，請重新拍攝' });
          return;
        }
        const confidence = Math.floor(80 + Math.random() * 18);
        const picks = [...location.keywords].sort(() => Math.random() - 0.5).slice(0, 3);
        if (confidence < 70) {
          resolve({ ok: false, confidence, detected: picks, msg: `辨識信心不足（${confidence}%），請重新拍攝` });
        } else {
          resolve({ ok: true, confidence, detected: picks, msg: `辨識成功：${location.name}` });
        }
      }, delay);
    });
  },

  // 店家核銷
  verifyCode(code) {
    const raw = localStorage.getItem(this._key);
    if (!raw) return { ok: false, msg: '查無此核銷碼' };
    const state = JSON.parse(raw);
    const record = state.redeemed.find(r => r.code === code.toUpperCase());
    if (!record) return { ok: false, msg: '查無此核銷碼' };
    if (record.used) return { ok: false, msg: `此核銷碼已於 ${new Date(record.usedAt).toLocaleString('zh-TW')} 使用`, record };
    const tier = TIERS.find(t => t.id === record.tierId);
    return { ok: true, record, tier, state };
  },

  markUsed(code) {
    const raw = localStorage.getItem(this._key);
    if (!raw) return false;
    const state = JSON.parse(raw);
    const record = state.redeemed.find(r => r.code === code.toUpperCase());
    if (!record || record.used) return false;
    record.used = true;
    record.usedAt = Date.now();
    this.save(state);
    return true;
  }
};

// ============================================
// 後台管理：地點資料編輯（admin.html 使用）
// ============================================
const LOCATIONS_ADMIN_KEY = 'bread_locations_override';

// 讀取：若有後台覆寫，使用覆寫版；否則用預設 LOCATIONS
function getActiveLocations() {
  const override = localStorage.getItem(LOCATIONS_ADMIN_KEY);
  return override ? JSON.parse(override) : LOCATIONS;
}
function saveLocationsOverride(locs) {
  localStorage.setItem(LOCATIONS_ADMIN_KEY, JSON.stringify(locs));
}
function resetLocationsOverride() {
  localStorage.removeItem(LOCATIONS_ADMIN_KEY);
}
