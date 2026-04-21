// ============================================
// LINE LIFF 整合啟動
// ─────────────────────────────────────────────
// 兩段式初始化：
//   1) LIFF_ID 存在 → 呼叫 liff.init，在 LINE 內自動登入取得 profile
//   2) LIFF_ID 為空或外部瀏覽器 → 建立「瀏覽器模擬訪客」身份，平台仍可運作
//
// 正式上線步驟：
//   (a) 到 LINE Developers Console 建立 Provider + LIFF App
//   (b) Endpoint URL 填：https://onelifegpt-tech.github.io/sunmoonlake-lowcarbon/
//   (c) Scope 勾選：profile + openid（+ chat_message.write 若要推播）
//   (d) 拿到 LIFF ID（例 1234567890-AbCdEfGh）填到下面的 LIFF_ID
// ============================================

window.LIFF_ID = '';  // ← 正式上線時把 LIFF ID 填這裡

(function initLineIntegration() {
  const statusBar = document.getElementById('lineStatus');
  const statusText = document.getElementById('lineStatusText');

  const setStatus = (text, state) => {
    if (!statusBar || !statusText) return;
    statusText.textContent = text;
    statusBar.dataset.state = state;  // 'ok' / 'demo' / 'loading'
  };

  // 沒有 LIFF ID，走瀏覽器模擬模式
  if (!window.LIFF_ID) {
    setStatus('🧪 瀏覽器模擬模式（未綁定 LINE）', 'demo');
    window.LINE_USER = { userId: 'DEMO-USER', displayName: '測試訪客', pictureUrl: null, mode: 'demo' };
    return;
  }

  if (typeof liff === 'undefined') {
    setStatus('⚠️ LIFF SDK 未載入', 'demo');
    window.LINE_USER = { userId: 'DEMO-USER', displayName: '測試訪客', pictureUrl: null, mode: 'demo' };
    return;
  }

  setStatus('🔗 連線 LINE 中...', 'loading');
  liff.init({ liffId: window.LIFF_ID })
    .then(async () => {
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }
      const profile = await liff.getProfile();
      window.LINE_USER = {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        mode: liff.isInClient() ? 'line-app' : 'line-browser'
      };
      // 把 LINE 資料寫入 DB state
      const s = DB.load();
      s.userId = profile.userId;
      s.displayName = profile.displayName;
      s.pictureUrl = profile.pictureUrl;
      DB.save(s);
      setStatus(`🟢 LINE：${profile.displayName}`, 'ok');
      // 重新 render 讓 UI 取得最新身份
      if (typeof render === 'function') render();
    })
    .catch((err) => {
      console.error('LIFF init failed', err);
      setStatus('⚠️ LIFF 初始化失敗（改用訪客模式）', 'demo');
      window.LINE_USER = { userId: 'DEMO-USER', displayName: '測試訪客', pictureUrl: null, mode: 'demo' };
    });
})();
