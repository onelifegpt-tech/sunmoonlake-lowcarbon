// ============================================
// App 主邏輯（無遊程版本）
// ============================================

let state = DB.load();
let currentTab = 'home';
let currentCategory = 'all';   // 首頁類別篩選
let mapInstance = null;         // Leaflet 地圖實例（綠色地圖）

// 從 URL 讀取 tab 參數（給 LINE Rich Menu 用）
// 支援：?tab=home / map / reward / history / news
(function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  const validTabs = ['home', 'map', 'reward', 'history', 'news'];
  if (tab && validTabs.includes(tab)) {
    currentTab = tab;
    // 若帶 tab 參數，直接跳過歡迎頁
    if (!state.onboarded) {
      state.onboarded = true;
      DB.save(state);
    }
  }
})();

// 正式部署時啟用：
// const LIFF_ID = 'YOUR_LIFF_ID';
// liff.init({ liffId: LIFF_ID }).then(async () => { ... });

// ===== 進度卡片 =====
function renderProgress() {
  const { earned, spent, balance } = DB.getBalance(state);
  const co2 = DB.getCO2(state);
  const checkedCount = state.checkIns.length;
  const locs = getActiveLocations();
  const percent = Math.min(100, (earned / MAX_POINTS) * 100);

  return `
    <div class="progress-card">
      <div class="progress-stats">
        <div class="stat-item">
          <div class="stat-value">${balance}</div>
          <div class="stat-label">可用點數</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${checkedCount}<span style="font-size:14px;color:#888">/${locs.length}</span></div>
          <div class="stat-label">已打卡點</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${co2.toFixed(1)}</div>
          <div class="stat-label">減碳 kg</div>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percent}%"></div>
      </div>
      <div class="progress-text">累積 ${earned} 點 / 最高 ${MAX_POINTS} 點 ・ 已兌換 ${spent} 點</div>
    </div>
  `;
}

// ===== Tabs =====
function renderTabs() {
  const tabs = [
    { id: 'home',    label: '集碳行動' },
    { id: 'map',     label: '綠色地圖' },
    { id: 'reward',  label: '兌換麵包' },
    { id: 'history', label: '我的點數' },
    { id: 'news',    label: '最新消息' }
  ];
  return `
    <div class="tabs">
      ${tabs.map(t => `
        <div class="tab ${currentTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</div>
      `).join('')}
    </div>
  `;
}

// ===== 最新消息 Tab =====
function renderNews() {
  return `
    <div class="section-title">Latest · 最新消息</div>
    <div class="news-list">
      <article class="news-item">
        <div class="news-date">04.22</div>
        <div class="news-body">
          <div class="news-title">日月潭低碳旅遊手帖・正式上線</div>
          <div class="news-desc">集結 16 家在地合作夥伴，以拍照與掃碼兩種方式，記錄屬於你的低碳旅程。</div>
        </div>
      </article>
      <article class="news-item">
        <div class="news-date">04.18</div>
        <div class="news-body">
          <div class="news-title">碳麵包首波兌換開始</div>
          <div class="news-desc">集滿 10 點即可兌換「碳麵包」紀念款。限量非賣品，僅致贈於完成旅程的旅人。</div>
        </div>
      </article>
      <article class="news-item">
        <div class="news-date">04.10</div>
        <div class="news-body">
          <div class="news-title">向山遊客中心加入合作據點</div>
          <div class="news-desc">經典清水模建築正式列入拍照打卡點，透過 AI 影像辨識即可累積 2 點。</div>
        </div>
      </article>
    </div>
  `;
}

// ===== 類別篩選器 =====
function renderCategoryFilter() {
  const cats = [
    { id: 'all', label: '全部' },
    ...Object.entries(CATEGORIES).map(([id, c]) => ({ id, label: `${c.icon} ${c.label}` }))
  ];
  return `
    <div class="cat-filter">
      ${cats.map(c => `
        <button class="cat-chip ${currentCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>
      `).join('')}
    </div>
  `;
}

// ===== 集碳行動：兩層式（先類別大卡 → 點進去看地點）=====
function renderHome() {
  // 第一層：尚未選類別 → 顯示 4 類大卡
  if (currentCategory === 'all') {
    return renderCategoryTiles();
  }
  // 第二層：已選某類別 → 顯示該類別所有地點
  return renderCategoryDetail(currentCategory);
}

// 類別大卡（第一層）
function renderCategoryTiles() {
  const locs = getActiveLocations();
  const counts = {};
  locs.forEach(l => { counts[l.category] = (counts[l.category] || 0) + 1; });

  const checkedCounts = {};
  state.checkIns.forEach(c => {
    const loc = locs.find(l => l.id === c.locationId);
    if (loc) checkedCounts[loc.category] = (checkedCounts[loc.category] || 0) + 1;
  });

  const order = ['experience', 'accommodation', 'restaurant', 'landmark'];
  const descriptions = {
    experience: '立槳、獨木舟、單車、纜車、遊湖，水陸體驗全攬',
    accommodation: '嚴選在地民宿與渡假飯店，入住即打卡累積點數',
    restaurant: '魚光窯烤雙店、在地咖啡、湖畔餐廳，美味留痕',
    landmark: '向山遊客中心、文武廟、慈恩塔，經典景致定格'
  };
  const methodDesc = {
    experience: '掃 QR 打卡',
    accommodation: '掃 QR 打卡',
    restaurant: '掃 QR 打卡',
    landmark: '拍照 AI 辨識'
  };

  return `
    <div class="section-title">
      <span>Categories</span>
      <span style="font-size:10px;color:var(--ink-4);font-weight:400;margin-left:auto;letter-spacing:0.2em">${locs.length} Locations · 4 Types</span>
    </div>
    <div class="cat-tiles">
      ${order.map(cat => {
        const meta = CATEGORIES[cat];
        const total = counts[cat] || 0;
        const checked = checkedCounts[cat] || 0;
        return `
          <div class="cat-tile" data-cat="${cat}">
            <div class="cat-tile-head">
              <span class="cat-tile-icon">${meta.icon}</span>
              <span class="cat-tile-count">${checked}<span>/${total}</span></span>
            </div>
            <div class="cat-tile-name">${meta.label}</div>
            <div class="cat-tile-desc">${descriptions[cat] || ''}</div>
            <div class="cat-tile-meta">
              <span class="cat-tile-method">${methodDesc[cat]}</span>
              <span class="cat-tile-arrow">→</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 類別詳細頁（第二層）
function renderCategoryDetail(cat) {
  const meta = CATEGORIES[cat];
  const locs = getActiveLocations().filter(l => l.category === cat);
  const checked = locs.filter(l => DB.hasCheckedIn(state, l.id)).length;

  return `
    <div class="cat-back-bar">
      <button class="cat-back-btn" data-cat="all">← 所有類別</button>
    </div>

    <div class="cat-detail-hero">
      <div class="cat-detail-icon">${meta.icon}</div>
      <div class="cat-detail-info">
        <div class="cat-detail-eyebrow">${cat.toUpperCase()}</div>
        <h2 class="cat-detail-title">${meta.label}</h2>
        <div class="cat-detail-progress">${checked} / ${locs.length} 已打卡</div>
      </div>
    </div>

    <div class="location-list-grid">
      ${locs.map(l => renderLocationCard(l)).join('')}
    </div>
  `;
}

function renderLocationCard(l) {
  const meta = CATEGORIES[l.category];
  const checked = DB.hasCheckedIn(state, l.id);
  const isPhoto = l.verifyMethod === 'photo';
  const methodBadge = isPhoto
    ? '<span class="badge photo">📷 拍照辨識</span>'
    : '<span class="badge qr">📱 QR 掃碼</span>';
  const methodIcon = isPhoto ? '📷' : '📱';
  return `
    <div class="location-card ${checked ? 'checked' : ''}" data-id="${l.id}">
      <div class="location-icon" style="background:${meta.color}22">${l.icon}</div>
      <div class="location-info">
        <div class="location-name">${l.name}</div>
        <div class="location-addr">📍 ${l.addr}</div>
        <div class="location-meta">
          <span class="badge points">+${l.points} 點</span>
          <span class="badge co2">減 ${l.co2} kg CO₂</span>
          ${methodBadge}
        </div>
      </div>
      <div class="location-status">${checked ? '✅' : methodIcon}</div>
    </div>
  `;
}

// ===== 綠色地圖（Leaflet） =====
function renderMapTab() {
  return `
    <div class="map-wrap">
      <div id="greenMap" class="green-map"></div>
      <div class="map-legend">
        ${Object.entries(CATEGORIES).map(([id, c]) => `
          <span class="legend-item">
            <span class="legend-dot" style="background:${c.color}"></span>${c.icon} ${c.label}
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

function initMap() {
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }
  const mapEl = document.getElementById('greenMap');
  if (!mapEl || typeof L === 'undefined') return;

  const locs = getActiveLocations();
  // 以日月潭中心點為初始視野
  mapInstance = L.map('greenMap').setView([23.865, 120.915], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(mapInstance);

  locs.forEach(l => {
    if (!l.lat || !l.lng) return;
    const meta = CATEGORIES[l.category];
    const checked = DB.hasCheckedIn(state, l.id);

    const customIcon = L.divIcon({
      className: 'map-marker',
      html: `<div class="map-marker-inner" style="background:${meta.color};${checked ? 'border-color:#06C755;box-shadow:0 0 0 3px #06C75566' : ''}">${l.icon}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([l.lat, l.lng], { icon: customIcon }).addTo(mapInstance);
    marker.bindPopup(`
      <div style="min-width:180px">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">${l.icon} ${l.name}</div>
        <div style="font-size:11px;color:#666;margin-bottom:6px">${l.addr}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">
          <span style="background:#e6f9ec;color:#06C755;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">+${l.points} 點</span>
          <span style="background:#f0f7ff;color:#5a8fcc;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">減 ${l.co2} kg</span>
          ${checked ? '<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">✓ 已打卡</span>' : ''}
        </div>
        <button onclick="openCheckInFromMap('${l.id}')" style="width:100%;padding:8px;background:#06C755;color:#fff;border:none;border-radius:14px;font-weight:700;font-size:12px;cursor:pointer">${checked ? '查看' : '📷 拍照打卡'}</button>
      </div>
    `);
  });
}

// 地圖彈窗內觸發打卡
window.openCheckInFromMap = (id) => {
  const loc = getActiveLocations().find(l => l.id === id);
  if (!loc) return;
  if (DB.hasCheckedIn(state, loc.id)) {
    showModal('✅', '已完成打卡', '此地點您已累積過點數');
    return;
  }
  showPhotoCheckIn(loc);
};

// ===== 兌換麵包 =====
function renderReward() {
  const { balance } = DB.getBalance(state);
  return `
    <div class="section-title">可兌換獎勵</div>
    ${TIERS.map(t => {
      const locked = balance < t.points;
      return `
        <div class="reward-card ${locked ? 'locked' : ''}">
          <div class="reward-header">
            <div>
              <div class="reward-name">${t.icon} ${t.name}</div>
              <div class="reward-desc">${t.desc}</div>
            </div>
            <div class="reward-points">${t.points} 點</div>
          </div>
          <button class="btn btn-primary" data-redeem="${t.id}" ${locked ? 'disabled' : ''}>
            ${locked ? `還差 ${t.points - balance} 點` : '立即兌換'}
          </button>
        </div>
      `;
    }).join('')}

    ${state.redeemed.length > 0 ? `
      <div class="section-title" style="margin-top:20px">我的兌換券</div>
      ${state.redeemed.map(r => {
        const tier = TIERS.find(t => t.id === r.tierId);
        return `
          <div class="reward-card">
            <div class="reward-header">
              <div>
                <div class="reward-name">${tier.icon} ${tier.name}</div>
                <div class="reward-desc">${new Date(r.timestamp).toLocaleString('zh-TW')}</div>
              </div>
            </div>
            <div class="modal-code">${r.code}</div>
            <div style="text-align:center;font-size:12px;color:var(--text-light)">
              ${r.used ? `✓ 已於 ${new Date(r.usedAt).toLocaleString('zh-TW')} 核銷` : '請至魚光窯烤任一門市出示此碼核銷'}
            </div>
          </div>
        `;
      }).join('')}
    ` : ''}
  `;
}

// ===== 我的紀錄 =====
function renderHistory() {
  if (state.checkIns.length === 0) {
    return `
      <div class="empty-state">
        <div class="icon">📷</div>
        <div>還沒有打卡紀錄</div>
        <div style="font-size:12px;margin-top:6px">前往合作地點拍照 AI 辨識即可集點</div>
      </div>
    `;
  }
  const sorted = [...state.checkIns].sort((a, b) => b.timestamp - a.timestamp);
  const locs = getActiveLocations();
  return `
    <div class="section-title">打卡紀錄（${state.checkIns.length} 筆）</div>
    ${sorted.map(c => {
      const loc = locs.find(l => l.id === c.locationId);
      if (!loc) return '';
      const cat = CATEGORIES[loc.category];
      return `
        <div class="location-card">
          <div class="location-icon" style="background:${cat.color}22">${loc.icon}</div>
          <div class="location-info">
            <div class="location-name">${loc.name}</div>
            <div class="location-addr">🕒 ${new Date(c.timestamp).toLocaleString('zh-TW')}</div>
            <div class="location-meta">
              <span class="badge points">+${c.points} 點</span>
              <span class="badge co2">減 ${c.co2} kg</span>
              ${c.method === 'photo' ? '<span class="badge photo">📷 AI 辨識</span>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('')}
    <div class="reset-link" id="resetBtn">重置所有資料（僅供測試）</div>
  `;
}

// ============================================
// QR 掃碼打卡 Modal（體驗 / 旅宿 / 餐廳）
// 使用 html5-qrcode，支援 LINE LIFF liff.scanCodeV2()
// ============================================
function showQRCheckIn(location) {
  const meta = CATEGORIES[location.category];
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal photo-modal">
      <div class="photo-modal-header" style="background:${meta.color}22">
        <div class="photo-loc-icon">${location.icon}</div>
        <div>
          <div class="photo-loc-name">${location.name}</div>
          <div class="photo-loc-addr">📍 ${location.addr}</div>
        </div>
      </div>

      <div class="photo-stage">
        <div class="photo-step" data-step="hint">
          <div class="photo-hint-card">
            <div class="photo-hint-icon">📱</div>
            <div class="photo-hint-title">請掃描 QR Code 打卡</div>
            <div class="photo-hint-text">${location.qrHint || '請掃描店家提供的 QR Code'}</div>
          </div>

          <div class="photo-rewards">
            <div class="photo-reward-item">
              <div class="pr-label">獲得點數</div>
              <div class="pr-value">+${location.points} 點</div>
            </div>
            <div class="photo-reward-item">
              <div class="pr-label">減碳貢獻</div>
              <div class="pr-value">${location.co2} kg CO₂</div>
            </div>
          </div>

          <button class="photo-upload-btn" id="startScanBtn">📷 開啟相機掃碼</button>

          <div style="margin-top:12px;padding:10px;background:#f9fafb;border-radius:8px;font-size:12px;color:#666">
            <div style="font-weight:600;margin-bottom:6px">💡 或手動輸入 QR 內容（測試用）</div>
            <div style="display:flex;gap:6px">
              <input id="manualQR" placeholder="checkin:${location.id}"
                style="flex:1;padding:6px 10px;border:1px solid #e5e7eb;border-radius:6px;font-family:monospace;font-size:12px">
              <button id="manualSubmit" style="padding:6px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit">送出</button>
            </div>
          </div>

          <div class="photo-upload-tip">💡 真實環境：於 LINE 內點擊連結後，LIFF 會自動開啟系統掃碼器</div>
        </div>

        <div class="photo-step" data-step="scanning" style="display:none">
          <div id="qrReader" style="width:100%;border-radius:10px;overflow:hidden;margin-bottom:14px"></div>
          <div class="ai-status-title">📷 對準 QR Code</div>
          <div class="ai-status-sub">請將店家提供的 QR Code 置於畫面中央</div>
          <button class="btn btn-outline" id="cancelScan" style="margin-top:12px">取消掃描</button>
        </div>

        <div class="photo-step" data-step="result" style="display:none">
          <div id="qrResult"></div>
        </div>
      </div>

      <button class="modal-close-x" id="modalCloseX">✕</button>
    </div>
  `;
  document.body.appendChild(backdrop);

  let html5QrScanner = null;
  const cleanup = () => {
    if (html5QrScanner) {
      try { html5QrScanner.stop(); html5QrScanner.clear(); } catch (e) {}
      html5QrScanner = null;
    }
  };

  backdrop.querySelector('#modalCloseX').onclick = () => { cleanup(); backdrop.remove(); };

  // 處理掃碼結果
  const handleScanResult = (qrContent) => {
    const verify = DB.verifyQR(location, qrContent);
    const resultBox = backdrop.querySelector('#qrResult');
    backdrop.querySelector('[data-step="scanning"]').style.display = 'none';
    backdrop.querySelector('[data-step="hint"]').style.display = 'none';
    backdrop.querySelector('[data-step="result"]').style.display = 'block';

    if (verify.ok) {
      DB.checkIn(state, location);
      resultBox.innerHTML = `
        <div style="font-size:70px;text-align:center;margin:14px 0">${location.icon}</div>
        <div class="result-badge success" style="display:block;text-align:center;margin:0 auto 10px">✓ 掃碼驗證成功</div>
        <div class="result-location" style="text-align:center">${location.name}</div>
        <div class="result-confidence" style="text-align:center">掃描內容：<code style="background:#f3f4f6;padding:2px 8px;border-radius:4px;font-size:12px">${qrContent}</code></div>
        <div class="result-points">
          <div class="rp-line"><span>獲得點數</span><strong>+${location.points} 點</strong></div>
          <div class="rp-line"><span>減碳貢獻</span><strong>${location.co2} kg CO₂</strong></div>
        </div>
        <button class="btn btn-primary" id="qrResultOk">完成・繼續集點</button>
      `;
      resultBox.querySelector('#qrResultOk').onclick = () => { backdrop.remove(); render(); };
    } else {
      resultBox.innerHTML = `
        <div style="font-size:60px;text-align:center;margin:14px 0">⚠️</div>
        <div class="result-badge fail" style="display:block;text-align:center;margin:0 auto 10px">✗ QR 驗證失敗</div>
        <div class="result-location" style="text-align:center">${verify.msg}</div>
        ${verify.scannedId ? `<div class="result-confidence" style="text-align:center">掃到：<code style="background:#fef2f2;padding:2px 8px;border-radius:4px;font-size:12px">${verify.scannedId}</code></div>` : ''}
        <button class="btn btn-primary" id="qrRetry">重新掃描</button>
        <button class="btn btn-outline" id="qrCancel" style="margin-top:8px">稍後再試</button>
      `;
      resultBox.querySelector('#qrRetry').onclick = () => { backdrop.remove(); showQRCheckIn(location); };
      resultBox.querySelector('#qrCancel').onclick = () => backdrop.remove();
    }
  };

  // 按鈕：開啟相機掃碼
  backdrop.querySelector('#startScanBtn').onclick = async () => {
    // 若在 LINE LIFF 環境，優先用原生掃碼
    if (window.liff && window.liff.isInClient && window.liff.isInClient()) {
      try {
        const result = await window.liff.scanCodeV2();
        if (result && result.value) {
          handleScanResult(result.value);
          return;
        }
      } catch (e) {
        console.warn('LIFF scan failed, fallback to browser camera', e);
      }
    }

    // 瀏覽器相機掃碼（html5-qrcode）
    backdrop.querySelector('[data-step="hint"]').style.display = 'none';
    backdrop.querySelector('[data-step="scanning"]').style.display = 'block';

    if (typeof Html5Qrcode === 'undefined') {
      alert('QR 掃碼模組載入中，請稍後再試（或使用手動輸入）');
      backdrop.querySelector('[data-step="scanning"]').style.display = 'none';
      backdrop.querySelector('[data-step="hint"]').style.display = 'block';
      return;
    }

    html5QrScanner = new Html5Qrcode('qrReader');
    try {
      await html5QrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          cleanup();
          handleScanResult(decodedText);
        },
        () => {} // 忽略每幀失敗
      );
    } catch (err) {
      alert('無法啟動相機：' + err + '\n請改用手動輸入');
      backdrop.querySelector('[data-step="scanning"]').style.display = 'none';
      backdrop.querySelector('[data-step="hint"]').style.display = 'block';
    }
  };

  backdrop.querySelector('#cancelScan').onclick = () => {
    cleanup();
    backdrop.querySelector('[data-step="scanning"]').style.display = 'none';
    backdrop.querySelector('[data-step="hint"]').style.display = 'block';
  };

  // 手動輸入（測試用）
  backdrop.querySelector('#manualSubmit').onclick = () => {
    const val = backdrop.querySelector('#manualQR').value.trim();
    if (!val) { alert('請輸入 QR Code 內容'); return; }
    handleScanResult(val);
  };
  backdrop.querySelector('#manualQR').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') backdrop.querySelector('#manualSubmit').click();
  });
}

// ============================================
// 拍照打卡 Modal（核心：AI 影像辨識）
// ============================================
function showPhotoCheckIn(location) {
  const meta = CATEGORIES[location.category];
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal photo-modal">
      <div class="photo-modal-header" style="background:${meta.color}22">
        <div class="photo-loc-icon">${location.icon}</div>
        <div>
          <div class="photo-loc-name">${location.name}</div>
          <div class="photo-loc-addr">📍 ${location.addr}</div>
        </div>
      </div>

      <div class="photo-stage" id="photoStage">
        <!-- 步驟 1：提示拍什麼 -->
        <div class="photo-step" data-step="hint">
          <div class="photo-hint-card">
            <div class="photo-hint-icon">📸</div>
            <div class="photo-hint-title">請拍攝此地點照片</div>
            <div class="photo-hint-text">${location.photoHint}</div>
          </div>
          <div class="photo-rewards">
            <div class="photo-reward-item">
              <div class="pr-label">獲得點數</div>
              <div class="pr-value">+${location.points} 點</div>
            </div>
            <div class="photo-reward-item">
              <div class="pr-label">減碳貢獻</div>
              <div class="pr-value">${location.co2} kg CO₂</div>
            </div>
          </div>
          <label class="photo-upload-btn" for="photoInput-${location.id}">
            📷 拍照 / 選擇相簿
          </label>
          <input type="file" id="photoInput-${location.id}" accept="image/*" capture="environment" style="display:none">
          <div class="photo-upload-tip">💡 真實環境：於 LINE 聊天室上傳照片，AI Bot 自動辨識並回傳集點結果</div>
        </div>

        <!-- 步驟 2：辨識中 -->
        <div class="photo-step" data-step="verifying" style="display:none">
          <img id="photoPreview" class="photo-preview" alt="">
          <div class="ai-progress">
            <div class="ai-dot"></div>
            <div class="ai-dot"></div>
            <div class="ai-dot"></div>
          </div>
          <div class="ai-status-title">🔍 AI 影像辨識中...</div>
          <div class="ai-status-sub" id="aiStatusSub">分析建築特徵 / 比對地點資料庫</div>
          <div class="ai-tech-note">使用 Vision API 進行物件偵測與相似度比對</div>
        </div>

        <!-- 步驟 3：辨識結果 -->
        <div class="photo-step" data-step="result" style="display:none">
          <div id="photoResult"></div>
        </div>
      </div>
      <button class="modal-close-x" id="modalCloseX">✕</button>
    </div>
  `;
  document.body.appendChild(backdrop);

  backdrop.querySelector('#modalCloseX').onclick = () => backdrop.remove();

  const fileInput = backdrop.querySelector(`#photoInput-${location.id}`);
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      backdrop.querySelector('[data-step="hint"]').style.display = 'none';
      backdrop.querySelector('[data-step="verifying"]').style.display = 'block';
      backdrop.querySelector('#photoPreview').src = dataUrl;

      const statusSub = backdrop.querySelector('#aiStatusSub');
      const statuses = ['上傳照片中...', '擷取影像特徵...', '比對地點資料庫...', '計算相似度...'];
      let i = 0;
      const statusTimer = setInterval(() => {
        statusSub.textContent = statuses[i % statuses.length];
        i++;
      }, 500);

      const result = await DB.verifyPhoto(location, file);
      clearInterval(statusTimer);

      backdrop.querySelector('[data-step="verifying"]').style.display = 'none';
      backdrop.querySelector('[data-step="result"]').style.display = 'block';
      const resultBox = backdrop.querySelector('#photoResult');

      if (result.ok) {
        DB.checkIn(state, location, dataUrl);
        resultBox.innerHTML = `
          <img class="photo-preview" src="${dataUrl}" alt="">
          <div class="result-badge success">✓ 辨識成功</div>
          <div class="result-location">${location.icon} ${location.name}</div>
          <div class="result-confidence">相似度 <strong>${result.confidence}%</strong></div>
          <div class="result-detected">
            <div class="rd-label">AI 偵測到的特徵：</div>
            <div class="rd-tags">
              ${result.detected.map(k => `<span class="rd-tag">✓ ${k}</span>`).join('')}
            </div>
          </div>
          <div class="result-points">
            <div class="rp-line"><span>獲得點數</span><strong>+${location.points} 點</strong></div>
            <div class="rp-line"><span>減碳貢獻</span><strong>${location.co2} kg CO₂</strong></div>
          </div>
          <button class="btn btn-primary" id="resultOk">完成・繼續集點</button>
        `;
        resultBox.querySelector('#resultOk').onclick = () => {
          backdrop.remove();
          render();
        };
      } else {
        resultBox.innerHTML = `
          <img class="photo-preview" src="${dataUrl}" alt="">
          <div class="result-badge fail">✗ 辨識失敗</div>
          <div class="result-location">${result.msg}</div>
          ${result.confidence ? `<div class="result-confidence">相似度 <strong>${result.confidence}%</strong>（需 ≥ 70%）</div>` : ''}
          <button class="btn btn-primary" id="retryBtn">重新拍攝</button>
          <button class="btn btn-outline" id="cancelBtn" style="margin-top:8px">稍後再試</button>
        `;
        resultBox.querySelector('#retryBtn').onclick = () => {
          backdrop.remove();
          showPhotoCheckIn(location);
        };
        resultBox.querySelector('#cancelBtn').onclick = () => backdrop.remove();
      }
    };
    reader.readAsDataURL(file);
  };
}

// ===== 通用 Modal =====
function showModal(icon, title, msg, onClose) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-icon">${icon}</div>
      <div class="modal-title">${title}</div>
      <div class="modal-msg">${msg}</div>
      <button class="btn btn-primary" id="modalClose">確定</button>
    </div>
  `;
  document.body.appendChild(backdrop);
  const close = () => {
    backdrop.remove();
    if (onClose) onClose();
  };
  backdrop.querySelector('#modalClose').onclick = close;
  backdrop.onclick = (e) => { if (e.target === backdrop) close(); };
}

function showRedeemModal(tier, code) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-icon">${tier.icon}</div>
      <div class="modal-title">兌換成功</div>
      <div class="modal-msg">已成功兌換「${tier.name}」<br>請至魚光窯烤門市出示核銷碼</div>
      <div class="modal-code">${code}</div>
      <button class="btn btn-primary" id="modalClose">完成</button>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.querySelector('#modalClose').onclick = () => { backdrop.remove(); render(); };
}

// ===== Render 主函式 =====
function render() {
  if (!state.onboarded && state.checkIns.length === 0) {
    renderWelcome();
    return;
  }

  // 沉浸式模式（獨立頁面，從 LINE Rich Menu 進來，按 ✕ 回 LINE）
  if (currentTab === 'map')    { renderMapFullscreen(); return; }
  if (currentTab === 'home')   { renderHomeFullscreen(); return; }
  if (currentTab === 'reward') { renderRewardFullscreen(); return; }
  if (currentTab === 'history'){ renderHistoryFullscreen(); return; }
  if (currentTab === 'news')   { renderNewsFullscreen(); return; }

  // 備援（不應發生）
  document.getElementById('app').innerHTML = '';
}

// ===== 沉浸式通用殼層（close button + title） =====
function immersiveShell({ eyebrow, title, body, footer = '' }) {
  return `
    <div class="immersive-page">
      <button class="imm-close" id="immClose" aria-label="關閉">
        <span class="imm-close-icon">✕</span>
      </button>
      <div class="imm-title-pill">
        <div class="imm-title-eyebrow">${eyebrow}</div>
        <div class="imm-title-label">${title}</div>
      </div>
      <div class="imm-body">
        ${body}
      </div>
      ${footer}
    </div>
  `;
}

function bindImmersiveClose() {
  const btn = document.getElementById('immClose');
  if (!btn) return;
  btn.onclick = () => {
    if (window.liff && typeof liff.closeWindow === 'function' && liff.isInClient && liff.isInClient()) {
      try { liff.closeWindow(); return; } catch (e) {}
    }
    if (window.history.length > 1 && document.referrer) window.history.back();
    else window.close();
  };
}

// ===== 集碳行動・沉浸式 =====
function renderHomeFullscreen() {
  const { earned, balance } = DB.getBalance(state);
  const co2 = DB.getCO2(state);
  const locs = getActiveLocations();
  const checkedCount = state.checkIns.length;

  // 浮動底部進度條
  const progressFooter = `
    <div class="imm-progress-footer">
      <div class="ipf-row">
        <div class="ipf-stat">
          <span class="ipf-value">${balance}</span>
          <span class="ipf-label">可用點數</span>
        </div>
        <div class="ipf-divider"></div>
        <div class="ipf-stat">
          <span class="ipf-value">${checkedCount}<span class="ipf-sub">/${locs.length}</span></span>
          <span class="ipf-label">已打卡</span>
        </div>
        <div class="ipf-divider"></div>
        <div class="ipf-stat">
          <span class="ipf-value">${co2.toFixed(1)}</span>
          <span class="ipf-label">減碳 kg</span>
        </div>
      </div>
    </div>
  `;

  let body;
  if (currentCategory === 'all') {
    body = renderCategoryTiles();
  } else {
    body = renderCategoryDetail(currentCategory);
  }

  document.getElementById('app').innerHTML = immersiveShell({
    eyebrow: 'Collect · 集碳行動',
    title: currentCategory === 'all' ? '選擇類別' : CATEGORIES[currentCategory]?.label || '',
    body,
    footer: progressFooter
  });

  bindImmersiveClose();
  bindEvents();
}

// ===== 兌換麵包・沉浸式 =====
function renderRewardFullscreen() {
  document.getElementById('app').innerHTML = immersiveShell({
    eyebrow: 'Redeem · 兌換麵包',
    title: '碳麵包',
    body: renderReward()
  });
  bindImmersiveClose();
  bindEvents();
}

// ===== 我的點數・沉浸式 =====
function renderHistoryFullscreen() {
  const { earned, balance, spent } = DB.getBalance(state);
  const co2 = DB.getCO2(state);
  const checkedCount = state.checkIns.length;
  const locs = getActiveLocations();

  const summary = `
    <div class="imm-history-summary">
      <div class="ihs-row">
        <div class="ihs-stat">
          <div class="ihs-value">${balance}</div>
          <div class="ihs-label">可用點數</div>
        </div>
        <div class="ihs-stat">
          <div class="ihs-value">${earned}</div>
          <div class="ihs-label">累積獲得</div>
        </div>
        <div class="ihs-stat">
          <div class="ihs-value">${spent}</div>
          <div class="ihs-label">已兌換</div>
        </div>
      </div>
      <div class="ihs-meta">
        <span>已打卡 ${checkedCount} / ${locs.length} 處</span>
        <span class="ihs-dot">·</span>
        <span>減碳 ${co2.toFixed(1)} kg CO₂</span>
      </div>
    </div>
  `;

  document.getElementById('app').innerHTML = immersiveShell({
    eyebrow: 'My Points · 我的點數',
    title: '旅程足跡',
    body: summary + renderHistory()
  });
  bindImmersiveClose();
  bindEvents();
}

// ===== 最新消息・沉浸式 =====
function renderNewsFullscreen() {
  document.getElementById('app').innerHTML = immersiveShell({
    eyebrow: 'Latest · 最新消息',
    title: 'Journal',
    body: renderNews()
  });
  bindImmersiveClose();
  bindEvents();
}

// ===== 綠色地圖・沉浸式模式 =====
// 只有地圖本身，所有 UI 元件浮於地圖之上（像 Google Maps / Airbnb）
function renderMapFullscreen() {
  document.getElementById('app').innerHTML = `
    <div class="immersive-map">
      <div id="greenMap" class="green-map immersive"></div>

      <!-- 浮動關閉鈕（左上）· 在 LINE 裡會關閉回聊天室 -->
      <button class="map-float-back" id="fsBackBtn" aria-label="關閉">
        <span class="mfb-arrow" id="fsBackIcon">✕</span>
      </button>

      <!-- 浮動標題（上方中央） -->
      <div class="map-float-title">
        <div class="mft-eyebrow">Green Map</div>
        <div class="mft-label">綠色地圖</div>
      </div>

      <!-- 浮動圖例（右下，可展開／收合） -->
      <div class="map-float-legend" id="mapLegend">
        <button class="mfl-toggle" id="mflToggle" aria-label="圖例">
          <span class="mfl-icon">◯</span>
          <span class="mfl-text">圖例</span>
        </button>
        <div class="mfl-panel">
          <div class="mfl-title">Legend · 據點分類</div>
          ${Object.entries(CATEGORIES).map(([id, c]) => {
            const count = getActiveLocations().filter(l => l.category === id).length;
            return `
              <div class="mfl-row">
                <span class="legend-dot" style="background:${c.color}"></span>
                <span class="mfl-name">${c.label}</span>
                <span class="mfl-count">${count}</span>
              </div>
            `;
          }).join('')}
          <div class="mfl-footer">共 ${getActiveLocations().length} 處・點選據點進行打卡</div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('fsBackBtn').onclick = () => {
    // 在 LINE LIFF 裡：關閉視窗回到聊天室
    if (window.liff && typeof liff.closeWindow === 'function' && liff.isInClient && liff.isInClient()) {
      try { liff.closeWindow(); return; } catch (e) {}
    }
    // 瀏覽器模式：若有上一頁就回上一頁，否則回首頁
    if (window.history.length > 1 && document.referrer) {
      window.history.back();
    } else {
      currentTab = 'home';
      currentCategory = 'all';
      render();
    }
  };
  const legend = document.getElementById('mapLegend');
  document.getElementById('mflToggle').onclick = () => {
    legend.classList.toggle('expanded');
  };
  setTimeout(initMap, 50);
}

function renderWelcome() {
  document.getElementById('app').innerHTML = `
    <div class="welcome">
      <div class="welcome-hero">
        <div class="eyebrow">Sun Moon Lake</div>
        <h1>日月潭低碳旅遊<em>A Low-Carbon Journal</em></h1>
        <p>一本屬於旅人的手帖，<br>紀錄每一次踏訪在地的足跡，<br>以一顆碳麵包，作為結尾的印記。</p>

        <div class="welcome-actions">
          <button class="btn btn-primary" id="startBtn">展開旅程</button>
        </div>
      </div>

      <div class="welcome-divider"></div>

      <div class="welcome-right">
        <div class="welcome-steps">
          <div class="welcome-step">
            <div class="ws-num">i.</div>
            <div class="ws-body">
              <div class="ws-title">踏訪在地據點</div>
              <div class="ws-desc">體驗、旅宿、餐飲、景點共 ${getActiveLocations().length} 處，皆為嚴選合作夥伴。</div>
            </div>
          </div>
          <div class="welcome-step">
            <div class="ws-num">ii.</div>
            <div class="ws-body">
              <div class="ws-title">拍照或掃碼留痕</div>
              <div class="ws-desc">景點類以影像辨識記錄，體驗與店家則掃描專屬 QR Code。</div>
            </div>
          </div>
          <div class="welcome-step">
            <div class="ws-num">iii.</div>
            <div class="ws-body">
              <div class="ws-title">集滿十點，兌換碳麵包</div>
              <div class="ws-desc">專屬完成旅程的紀念款，非賣品，僅致贈於低碳旅人。</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('startBtn').onclick = () => {
    state.onboarded = true;
    DB.save(state);
    render();
  };
}

// ===== 綁事件 =====
function bindEvents() {
  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => { currentTab = t.dataset.tab; render(); };
  });

  document.querySelectorAll('.cat-chip').forEach(c => {
    c.onclick = () => { currentCategory = c.dataset.cat; render(); };
  });

  // 類別大卡（第一層 → 第二層）
  document.querySelectorAll('.cat-tile').forEach(t => {
    t.onclick = () => { currentCategory = t.dataset.cat; render(); };
  });

  // 類別詳情返回（第二層 → 第一層）
  document.querySelectorAll('.cat-back-btn').forEach(b => {
    b.onclick = () => { currentCategory = b.dataset.cat || 'all'; render(); };
  });

  // 全域：任何浮動 close/back 鈕皆回 LINE
  document.querySelectorAll('[data-close-liff]').forEach(b => {
    b.onclick = () => {
      if (window.liff && typeof liff.closeWindow === 'function' && liff.isInClient && liff.isInClient()) {
        try { liff.closeWindow(); return; } catch (e) {}
      }
      window.history.length > 1 ? window.history.back() : (currentTab = 'home', render());
    };
  });

  // 地點卡：點擊依 verifyMethod 分流
  document.querySelectorAll('.location-card[data-id]').forEach(c => {
    c.onclick = () => {
      const loc = getActiveLocations().find(l => l.id === c.dataset.id);
      if (DB.hasCheckedIn(state, loc.id)) {
        showModal('✅', '已完成打卡', '此地點您已累積過點數，請繼續前往其他打卡點');
        return;
      }
      if (loc.verifyMethod === 'qr') {
        showQRCheckIn(loc);
      } else {
        showPhotoCheckIn(loc);
      }
    };
  });

  document.querySelectorAll('[data-redeem]').forEach(b => {
    b.onclick = () => {
      const tier = TIERS.find(t => t.id === b.dataset.redeem);
      const result = DB.redeem(state, tier);
      if (result.ok) showRedeemModal(tier, result.code);
      else showModal('⚠️', '兌換失敗', result.msg);
    };
  });

  const reset = document.getElementById('resetBtn');
  if (reset) {
    reset.onclick = () => {
      if (confirm('確定要清除所有資料嗎？')) {
        DB.reset();
        state = DB.load();
        render();
      }
    };
  }
}

// ===== 啟動 =====
render();
