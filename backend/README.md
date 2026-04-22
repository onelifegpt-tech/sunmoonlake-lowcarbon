# LINE Messaging API 後端 · Cloudflare Worker

給「日月潭低碳旅遊手帖」使用的訊息收發後端。
完全免費（Cloudflare Workers 每日 10 萬次請求免費、KV 1GB 免費）。

---

## 🗺️ 架構

```
       LINE 使用者手機
              ↓ ↑
    LINE Messaging API
              ↓ ↑
    ┌────────────────────────────┐
    │ Cloudflare Worker          │
    │ (這個 worker.js)            │
    │                            │
    │ - Token 存 Secret 變數      │
    │ - 會員存 KV (MEMBERS)       │
    └─────────┬──────────────────┘
              ↓ ↑
    前端網頁（GitHub Pages）
    - members.html 呼叫 /api/broadcast
    - admin.html 看會員清單
```

---

## 🚀 部署 5 步驟（約 10 分鐘）

### 準備：建 Messaging API Channel（不是 LIFF 那個）

1. 開啟 [LINE Developers Console](https://developers.line.biz/console/)
2. 進入你的 Provider → 點 **Create a new channel** → 選 **Messaging API**
3. 填資料：
   - Channel name：`魚光窯烤 · 推播`
   - Channel icon：上傳 LOGO
   - Category：Food and Drink
   - 填完 Create
4. 建立後，進入該 Channel，記下：
   - **Channel Secret**（Basic settings 頁面）
   - **Channel access token**（Messaging API 頁面底部，點 Issue 產生 long-lived token）
5. 同頁面下方 **「Webhook URL」** 先留空，等部署完 Worker 後回填
6. 到 [LINE Official Account Manager](https://manager.line.biz/) → 你的 OA → 設定 → Messaging API → 連動這個 Channel（會叫你貼 Provider / Channel ID）

---

### Step 1：安裝 Wrangler CLI

```bash
cd backend
npm install
```

首次使用要登入 Cloudflare：
```bash
npx wrangler login
```
（會開瀏覽器，登入 / 註冊 Cloudflare 免費帳號）

---

### Step 2：建立 KV Namespace（存會員資料）

```bash
npx wrangler kv namespace create MEMBERS
```

會出現：
```
🌀 Creating namespace with title "sunmoonlake-lowcarbon-api-MEMBERS"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
[[kv_namespaces]]
binding = "MEMBERS"
id = "abc1234567890def"      ← 複製這個 id
```

把這段貼到 `wrangler.toml`（取消下方 `#` 註解並填入 id）：
```toml
[[kv_namespaces]]
binding = "MEMBERS"
id = "abc1234567890def"
```

---

### Step 3：設定機密環境變數（Secret）

**一個一個跑這三個指令**，每次都會問你要貼什麼值：

```bash
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
# → 貼 Channel access token（那串 172 字）

npx wrangler secret put LINE_CHANNEL_SECRET
# → 貼 Channel Secret（短字串，約 32 字）

npx wrangler secret put ADMIN_TOKEN
# → 自己輸入一組強密碼（例如 a9Kj!mQp7x#2VdRnB4zEwT6）
# → 這個會貼到前端 admin.html 的設定裡
```

---

### Step 4：部署 Worker

```bash
npx wrangler deploy
```

成功後會顯示：
```
Uploaded sunmoonlake-lowcarbon-api
Published sunmoonlake-lowcarbon-api
  https://sunmoonlake-lowcarbon-api.你的子網域.workers.dev
```

✅ 記下這個網址 → 後面 2 個地方都會用到。

測試是否活著：
```bash
curl https://sunmoonlake-lowcarbon-api.你的子網域.workers.dev/api/health
# 應回：{"ok":true,"time":"..."}
```

---

### Step 5：設定 LINE Webhook URL

1. 回 LINE Developers Console → 你的 Messaging API Channel → Messaging API 頁籤
2. **Webhook URL** 填：
   ```
   https://sunmoonlake-lowcarbon-api.你的子網域.workers.dev/api/webhook
   ```
3. 按 **Verify** → 應顯示 `Success`
4. 開啟 **Use webhook**
5. 關閉 **Auto-reply messages** 和 **Greeting messages**（避免和 Worker 回應衝突）

---

## ✅ 測試

### 測試加好友流程
1. 手機 LINE 加你的官方帳號
2. 應該收到自動歡迎訊息
3. 打開 admin.html → 會員管理 → 看到自己出現

### 測試全體推播
1. 在 members.html 填入 Worker URL 和 ADMIN_TOKEN
2. 按「📣 推播給全體」
3. 自己的 LINE 應收到訊息

---

## 🔐 安全提醒

- ✅ `wrangler.toml` **可以** commit 到 GitHub（不含機密）
- ❌ **絕對不要** 把 Channel access token / secret 寫進任何 .js / .html
- ✅ Secret 都透過 `wrangler secret put` 存在 Cloudflare，不會進 Git
- ✅ `ADMIN_TOKEN` 只給你自己知道，前端呼叫 API 時會以 header 帶上

---

## 📋 API 參考

| 路徑 | 方法 | 說明 | 需 Auth |
|------|------|------|---------|
| `/api/health` | GET | 健康檢查 | ❌ |
| `/api/webhook` | POST | LINE 事件接收 | LINE 簽章驗證 |
| `/api/members` | GET | 所有會員 | ✅ X-Admin-Token |
| `/api/stats` | GET | 會員統計 | ✅ X-Admin-Token |
| `/api/push` | POST | 推單人 `{userId, text}` | ✅ X-Admin-Token |
| `/api/broadcast` | POST | 推全體 `{text}` | ✅ X-Admin-Token |

---

## 🐛 除錯

即時 log：
```bash
npx wrangler tail
```

然後手機 LINE 傳訊息給 OA，就能看到 Worker 收到什麼。

---

## 📊 Cloudflare 免費額度（足夠實務使用）

| 資源 | 免費額度 |
|------|---------|
| Worker 請求 | 10 萬次/天 |
| Worker CPU 時間 | 10ms/請求 |
| KV 讀取 | 10 萬次/天 |
| KV 寫入 | 1 千次/天 |
| KV 儲存 | 1 GB |

換算：若每天有 500 位會員、每人送 10 個訊息 = 5,000 次請求，遠低於上限。
