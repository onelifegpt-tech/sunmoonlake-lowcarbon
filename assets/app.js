// ============================================
// App 主邏輯（無遊程版本）
// ============================================

let state = DB.load();
let currentTab = 'home';
let currentCategory = 'all';   // 首頁類別篩選
let mapInstance = null;         // Leaflet 地圖實例（綠色地圖）

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

// ===== Tabs（加入綠色地圖） =====
function renderTabs() {
  const tabs = [
    { id: 'home',    label: '集點地圖' },
    { id: 'map',     label: '🗺️ 綠色地圖' },
    { id: 'reward',  label: '兌換麵包' },
    { id: 'history', label: '我的紀錄' }
  ];
  return `
    <div class="tabs">
      ${tabs.map(t => `
        <div class="tab ${currentTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</div>
      `).join('')}
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

// ===== 集點地圖（4 類地點列表） =====
function renderHome() {
  const locs = getActiveLocations();
  const filtered = currentCategory === 'all' ? locs : locs.filter(l => l.category === currentCategory);

  const grouped = {};
  filtered.forEach(l => {
    if (!grouped[l.category]) grouped[l.category] = [];
    grouped[l.category].push(l);
  });

  const categoryOrder = ['experience', 'accommodation', 'restaurant', 'landmark'];
  const body = categoryOrder.filter(c => grouped[c]).map(cat => {
    const meta = CATEGORIES[cat];
    return `
      <div class="section-title">
        <span class="category-chip" style="background:${meta.color}">${meta.icon} ${meta.label}</span>
        <span style="font-size:11px;color:#888;font-weight:400;margin-left:8px">${grouped[cat].length} 個點</span>
      </div>
      ${grouped[cat].map(l => renderLocationCard(l)).join('')}
    `;
  }).join('');

  return renderCategoryFilter() + body;
}

function renderLocationCard(l) {
  const meta = CATEGORIES[l.category];
  const checked = DB.hasCheckedIn(state, l.id);
  return `
    <div class="location-card ${checked ? 'checked' : ''}" data-id="${l.id}">
      <div class="location-icon" style="background:${meta.color}22">${l.icon}</div>
      <div class="location-info">
        <div class="location-name">${l.name}</div>
        <div class="location-addr">📍 ${l.addr}</div>
        <div class="location-meta">
          <span class="badge points">+${l.points} 點</span>
          <span class="badge co2">減 ${l.co2} kg CO₂</span>
          <span class="badge photo">📷 拍照辨識</span>
        </div>
      </div>
      <div class="location-status">${checked ? '✅' : '📷'}</div>
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
              ${r.used ? `✓ 已於 ${new Date(r.usedAt).toLocaleString('zh-TW')} 核銷` : '請至漁光窯烤任一門市出示此碼核銷'}
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
      <div class="modal-msg">已成功兌換「${tier.name}」<br>請至漁光窯烤門市出示核銷碼</div>
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

  let body = '';
  if (currentTab === 'home')    body = renderHome();
  else if (currentTab === 'map') body = renderMapTab();
  else if (currentTab === 'reward') body = renderReward();
  else if (currentTab === 'history') body = renderHistory();

  document.getElementById('app').innerHTML = `
    <div class="app-header">
      <h1>🌿 日月潭低碳集點</h1>
      <div class="subtitle">到 ${getActiveLocations().length} 個合作點・拍照 AI 辨識・集點兌換麵包</div>
    </div>
    ${renderProgress()}
    ${renderTabs()}
    <div class="content">${body}</div>
  `;

  bindEvents();

  // 若切到地圖 Tab，初始化 Leaflet
  if (currentTab === 'map') {
    setTimeout(initMap, 50);
  }
}

function renderWelcome() {
  document.getElementById('app').innerHTML = `
    <div class="welcome">
      <div class="welcome-hero">
        <div class="welcome-emoji">🌿</div>
        <h1>歡迎來到<br>日月潭低碳集點</h1>
        <p>拍照打卡・累積減碳・兌換麵包</p>
      </div>
      <div class="welcome-steps">
        <div class="welcome-step">
          <div class="ws-num">1</div>
          <div class="ws-body">
            <div class="ws-title">前往合作地點</div>
            <div class="ws-desc">體驗、旅宿、餐廳、景點 共 ${getActiveLocations().length} 個點</div>
          </div>
        </div>
        <div class="welcome-step">
          <div class="ws-num">2</div>
          <div class="ws-body">
            <div class="ws-title">拍照上傳 AI 辨識</div>
            <div class="ws-desc">系統自動比對地點並加點</div>
          </div>
        </div>
        <div class="welcome-step">
          <div class="ws-num">3</div>
          <div class="ws-body">
            <div class="ws-title">集滿 10 點兌換碳麵包</div>
            <div class="ws-desc">完成日月潭低碳旅程的專屬獎勵</div>
          </div>
        </div>
      </div>
      <div class="welcome-actions">
        <button class="btn btn-primary" id="startBtn">開始集點</button>
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

  // 地點卡：點擊開啟拍照上傳
  document.querySelectorAll('.location-card[data-id]').forEach(c => {
    c.onclick = () => {
      const loc = getActiveLocations().find(l => l.id === c.dataset.id);
      if (DB.hasCheckedIn(state, loc.id)) {
        showModal('✅', '已完成打卡', '此地點您已累積過點數，請繼續前往其他打卡點');
        return;
      }
      showPhotoCheckIn(loc);
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
