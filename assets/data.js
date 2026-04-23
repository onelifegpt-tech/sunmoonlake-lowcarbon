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
//   verifyMethod    ─ 'qr'（掃店家 QR）或 'photo'（EXIF GPS + pHash 驗證）
//   qrHint          ─ QR 掃碼提示（verifyMethod = qr 用）
//   photoHint       ─ 拍照提示（verifyMethod = photo 用）
//   gpsRadius       ─ EXIF GPS 允許誤差（公尺）
//   refPhoto        ─ pHash 比對用參考照路徑
//   phashThreshold  ─ pHash 漢明距離門檻（越小越嚴格，8×8 最大 64）
//
// 規則：
//   - 景點類 (landmark)：拍照驗證（EXIF GPS 為主、pHash 為輔、失敗進人工覆核）
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

  // 景點類（拍照驗證：EXIF GPS + pHash）
  { id: 'LAND-WW',   name: '文武廟',               category: 'landmark',      points: 1, co2: 0.5, icon: '⛩️',
    addr: '南投縣魚池鄉中正路 63 號',          lat: 23.8734, lng: 120.9247,
    verifyMethod: 'photo', photoHint: '請拍攝文武廟牌樓正面',
    gpsRadius: 150, refPhoto: 'assets/refs/wenwu.jpg', phashThreshold: 14 },
  { id: 'LAND-CE',   name: '慈恩塔',               category: 'landmark',      points: 1, co2: 0.5, icon: '🗼',
    addr: '南投縣魚池鄉中正路慈恩塔步道',      lat: 23.8567, lng: 120.9323,
    verifyMethod: 'photo', photoHint: '請拍攝慈恩塔塔身',
    gpsRadius: 200, refPhoto: 'assets/refs/cien.jpg', phashThreshold: 14 },
  { id: 'LAND-XS',   name: '向山遊客中心',         category: 'landmark',      points: 2, co2: 0.5, icon: '🏛️',
    addr: '南投縣魚池鄉中山路 599 號',         lat: 23.8517, lng: 120.9013,
    verifyMethod: 'photo', photoHint: '請拍攝清水模建築與開放廊道',
    gpsRadius: 150, refPhoto: 'assets/refs/xiangshan.jpg', phashThreshold: 14 },
  { id: 'LAND-SS',   name: '水社碼頭',             category: 'landmark',      points: 1, co2: 0.5, icon: '⛴️',
    addr: '南投縣魚池鄉水社村名勝街',          lat: 23.8639, lng: 120.9116,
    verifyMethod: 'photo', photoHint: '請拍攝水社碼頭棧道或湖景',
    gpsRadius: 200, refPhoto: 'assets/refs/shuishe.jpg', phashThreshold: 14 },
  { id: 'LAND-9F',   name: '九蛙疊像',             category: 'landmark',      points: 2, co2: 0.8, icon: '🐸',
    addr: '南投縣魚池鄉月潭自行車道',          lat: 23.8481, lng: 120.8886,
    verifyMethod: 'photo', photoHint: '請拍攝九蛙疊像（水位標記雕塑）',
    gpsRadius: 200, refPhoto: 'assets/refs/ninefrog.jpg', phashThreshold: 14 }
];

// 最大可能點數（全部打卡）
const MAX_POINTS = LOCATIONS.reduce((s, l) => s + l.points, 0);

// ============================================
// 影像驗證工具：EXIF GPS + 感知雜湊（aHash 8×8）
// ============================================
function _haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function _readExifGps(file) {
  if (typeof window === 'undefined' || !window.exifr) return null;
  try {
    const out = await window.exifr.gps(file);
    if (out && typeof out.latitude === 'number' && typeof out.longitude === 'number') {
      return { lat: out.latitude, lng: out.longitude };
    }
  } catch (e) { /* no-op */ }
  return null;
}

async function _computeAHash(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 8; canvas.height = 8;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 8, 8);
      const d = ctx.getImageData(0, 0, 8, 8).data;
      const gray = [];
      for (let i = 0; i < d.length; i += 4) gray.push(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]);
      const avg = gray.reduce((s, v) => s + v, 0) / gray.length;
      resolve(gray.map(v => v > avg ? 1 : 0));
    };
    img.onerror = reject;
    img.src = (src instanceof File || src instanceof Blob) ? URL.createObjectURL(src) : src;
  });
}

function _hamming(a, b) {
  if (!a || !b || a.length !== b.length) return 64;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

const _refHashCache = {};
async function _getReferenceHash(location) {
  // 支援兩種呼叫方式：傳 location 物件（新）或直接傳 url（舊）
  const uploaded = typeof location === 'object' && location
    ? DB.getRefPhoto(location.id)
    : null;
  const url = uploaded || (typeof location === 'string' ? location : location && location.refPhoto);
  if (!url) return null;
  if (_refHashCache[url]) return _refHashCache[url];
  try {
    const h = await _computeAHash(url);
    _refHashCache[url] = h;
    return h;
  } catch (e) {
    return null;
  }
}

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

  // checkIn 狀態：未指定視為 'approved'（舊 QR 流程相容）
  _isApproved(c) { return !c.status || c.status === 'approved'; },

  getBalance(state) {
    const earned = state.checkIns.filter(c => this._isApproved(c)).reduce((s, c) => s + c.points, 0);
    const spent = state.redeemed.reduce((s, r) => {
      const tier = TIERS.find(t => t.id === r.tierId);
      return s + (tier ? tier.points : 0);
    }, 0);
    return { earned, spent, balance: earned - spent };
  },

  getCO2(state) {
    return state.checkIns.filter(c => this._isApproved(c)).reduce((s, c) => s + c.co2, 0);
  },

  // 取得地點的打卡狀態：'none' | 'pending' | 'approved' | 'rejected'
  getCheckInStatus(state, locationId) {
    // 已通過優先
    if (state.checkIns.some(c => c.locationId === locationId && this._isApproved(c))) return 'approved';
    if (state.checkIns.some(c => c.locationId === locationId && c.status === 'pending')) return 'pending';
    if (state.checkIns.some(c => c.locationId === locationId && c.status === 'rejected')) return 'rejected';
    return 'none';
  },

  // 阻擋重複提交：approved 或 pending 皆視為已打卡；rejected 允許重試
  hasCheckedIn(state, locationId) {
    const s = this.getCheckInStatus(state, locationId);
    return s === 'approved' || s === 'pending';
  },

  checkIn(state, location, photoDataUrl = null, verifyMeta = null) {
    if (this.hasCheckedIn(state, location.id)) {
      return { ok: false, msg: '此地點已打卡過' };
    }
    state.checkIns.push({
      locationId: location.id,
      timestamp: Date.now(),
      points: location.points,
      co2: location.co2,
      method: verifyMeta ? `photo-${verifyMeta.via}` : (photoDataUrl ? 'photo' : 'qr'),
      status: 'approved',
      verifyMeta,
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
  // 照片驗證：EXIF GPS 為主、pHash 為輔、失敗進人工覆核佇列
  // 回傳：
  //   { ok: true, via: 'gps'|'phash', ...meta }                  → 即時通過
  //   { ok: false, pending: true, reason, ...meta }              → 進人工覆核
  //   { ok: false, msg }                                          → 直接退回（檔案無效）
  // ============================================
  async verifyPhoto(location, photoFile) {
    if (!photoFile || photoFile.size < 5 * 1024) {
      return { ok: false, msg: '照片檔案無效或過小' };
    }

    // 第一層：EXIF GPS
    const gps = await _readExifGps(photoFile);
    if (gps) {
      const dist = _haversineMeters(gps.lat, gps.lng, location.lat, location.lng);
      const radius = location.gpsRadius || 200;
      if (dist <= radius) {
        return {
          ok: true, via: 'gps',
          distance: Math.round(dist), radius,
          msg: `GPS 位置驗證通過（距景點 ${Math.round(dist)} 公尺）`
        };
      }
      // GPS 存在但超出範圍 → 不嘗試 pHash，直接進人工覆核（可能偽造）
      return {
        ok: false, pending: true, via: 'gps',
        reason: 'gps_out_of_range',
        distance: Math.round(dist), radius,
        msg: `照片 GPS 距離景點 ${Math.round(dist)} 公尺，已送人工覆核`
      };
    }

    // 第二層：pHash（優先用後台上傳版，再 fallback 到檔案路徑）
    const refHash = await _getReferenceHash(location);
    if (refHash) {
      try {
        const userHash = await _computeAHash(photoFile);
        const ham = _hamming(refHash, userHash);
        const threshold = location.phashThreshold || 14;
        if (ham <= threshold) {
          return {
            ok: true, via: 'phash',
            hamming: ham, threshold,
            msg: `影像比對通過（相似度距離 ${ham}/${threshold}）`
          };
        }
        return {
          ok: false, pending: true, via: 'phash',
          reason: 'phash_mismatch',
          hamming: ham, threshold,
          msg: `影像相似度不足（距離 ${ham}，門檻 ${threshold}），已送人工覆核`
        };
      } catch (e) {
        // 比對本身失敗 → 也進覆核
      }
    }

    // 第三層：無 GPS 且無可用參考照 → 直接進人工覆核
    return {
      ok: false, pending: true, via: 'none',
      reason: 'no_gps_no_reference',
      msg: '照片未含 GPS 資訊，已送人工覆核'
    };
  },

  // ============================================
  // 景點參考照（後台上傳版・存 dataURL 於 localStorage）
  // 正式版：替換成物件儲存（Firebase Storage / R2）
  // ============================================
  _refPhotoKey: 'bread_ref_photos',

  _loadRefPhotos() {
    const raw = localStorage.getItem(this._refPhotoKey);
    return raw ? JSON.parse(raw) : {};
  },

  getRefPhoto(locationId) {
    const all = this._loadRefPhotos();
    return all[locationId] || null;
  },

  setRefPhoto(locationId, dataUrl) {
    const all = this._loadRefPhotos();
    all[locationId] = dataUrl;
    try {
      localStorage.setItem(this._refPhotoKey, JSON.stringify(all));
      delete _refHashCache[dataUrl]; // 重算 hash
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: 'LocalStorage 空間不足（建議縮圖到 600px 以下）: ' + e.message };
    }
  },

  clearRefPhoto(locationId) {
    const all = this._loadRefPhotos();
    delete all[locationId];
    localStorage.setItem(this._refPhotoKey, JSON.stringify(all));
  },

  // 後台預覽：回傳參考照的 aHash（陣列 64 位）供比對或顯示
  async computeRefPhotoHash(locationId) {
    const url = this.getRefPhoto(locationId);
    if (!url) return null;
    return _computeAHash(url);
  },

  // ============================================
  // 人工覆核佇列（Demo：localStorage 共享；正式版需後端）
  // ============================================
  _reviewKey: 'bread_review_queue',

  addPending(state, location, photoDataUrl, verifyResult) {
    const entry = {
      pendingId: 'P' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      userId: state.userId,
      displayName: state.displayName,
      locationId: location.id,
      locationName: location.name,
      photoDataUrl,
      reason: verifyResult.reason || 'unknown',
      via: verifyResult.via || 'none',
      meta: {
        distance: verifyResult.distance,
        radius: verifyResult.radius,
        hamming: verifyResult.hamming,
        threshold: verifyResult.threshold
      },
      submittedAt: Date.now(),
      status: 'pending'   // pending | approved | rejected
    };

    // 寫入共享覆核佇列
    const queue = this.listPending();
    queue.push(entry);
    localStorage.setItem(this._reviewKey, JSON.stringify(queue));

    // 同步在使用者 state 留一筆 pending（不計點、不算已打卡）
    state.checkIns.push({
      locationId: location.id,
      timestamp: entry.submittedAt,
      points: 0,
      co2: 0,
      method: 'photo',
      status: 'pending',
      pendingId: entry.pendingId,
      photoPreview: photoDataUrl ? photoDataUrl.substring(0, 50) + '...' : null
    });
    this.save(state);
    return entry;
  },

  listPending() {
    const raw = localStorage.getItem(this._reviewKey);
    return raw ? JSON.parse(raw) : [];
  },

  // 營運方覆核操作（review.html 用）
  // 注意：Demo 僅同裝置有效；正式版：呼叫後端 API 推播通知使用者
  resolvePending(pendingId, decision /* 'approved' | 'rejected' */, reviewer = 'admin') {
    const queue = this.listPending();
    const entry = queue.find(p => p.pendingId === pendingId);
    if (!entry) return { ok: false, msg: '查無此覆核單' };
    if (entry.status !== 'pending') return { ok: false, msg: `此單已為 ${entry.status}` };

    entry.status = decision;
    entry.resolvedAt = Date.now();
    entry.reviewer = reviewer;
    localStorage.setItem(this._reviewKey, JSON.stringify(queue));

    // 同步到使用者 state（同裝置才有效）
    const raw = localStorage.getItem(this._key);
    if (raw) {
      const userState = JSON.parse(raw);
      if (userState.userId === entry.userId) {
        const checkIn = userState.checkIns.find(c => c.pendingId === pendingId);
        if (checkIn) {
          if (decision === 'approved') {
            const loc = LOCATIONS.find(l => l.id === entry.locationId);
            checkIn.status = 'approved';
            checkIn.points = loc ? loc.points : 0;
            checkIn.co2 = loc ? loc.co2 : 0;
            checkIn.method = 'photo-review';
          } else {
            checkIn.status = 'rejected';
          }
          localStorage.setItem(this._key, JSON.stringify(userState));
        }
      }
    }
    return { ok: true, entry };
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
