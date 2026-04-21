# 日月潭低碳麵包集點平台

南投地方 SBIR 提案原型・漁光窯烤 × 日月潭產業聯盟

## 🎯 這是什麼

一個綁定 LINE 的低碳旅遊集點系統。遊客走訪日月潭 13 個合作點打卡，累積點數後可兌換「不能用錢買」的社會影響力麵包。

**核心機制**：打卡 → 累積點數 → 兌換麵包 → 終點儀式

## 📂 檔案結構

```
低碳麵包集點/
├── tours.html       # 🌿 遊客啟程入口（選擇 3 款套裝遊程）
├── index.html       # 📱 遊客端 LIFF 主程式（集點、兌換、紀錄）
├── verify.html      # ✅ 店家核銷後台（漁光窯烤收碼用）
├── merchant.html    # 🖨️ 店家 QR Code 批次產生器
├── dashboard.html   # 📊 營運儀表板（SBIR 審查展示）
├── SBIR_提案書.md   # 📝 對標南投 115 SBIR 完整申請書
├── assets/
│   ├── data.js      # 地點、遊程、兌換資料 + 核銷 API
│   ├── style.css    # LINE 綠風格樣式
│   └── app.js       # 集點、兌換、儲存邏輯
└── README.md
```

## 🔄 完整系統操作流程

```
遊客 (LINE)              店家 (Web 後台)          營運方
─────────────            ─────────────           ────────
tours.html               merchant.html           dashboard.html
   ↓ 選遊程                  ↓ 印 QR                ↓ 看數據
index.html               (貼到實體店)            (SBIR KPI)
   ↓ 掃 QR 打卡
   ↓ 累積點數
   ↓ 兌換核銷碼
                         verify.html
                            ↓ 輸入核銷碼
                            ↓ 驗證發放麵包
```

## 🗺️ 合作點（共 13 個・最高 39 點）

| 類別 | 地點 | 點數 | 減碳 (kg) |
|------|------|------|-----------|
| 漁光窯烤 | 埔里店 | 2 | 1.0 |
| 漁光窯烤 | 魚池店 | 2 | 1.0 |
| 體驗行程 | 立槳 SUP | 3 | 2.5 |
| 體驗行程 | 獨木舟 | 3 | 2.5 |
| 體驗行程 | 環潭電動單車 | 2 | 4.0 |
| 體驗行程 | 日月潭纜車 | 2 | 1.5 |
| 體驗行程 | 電動遊湖船 | 2 | 2.0 |
| 景點餐廳 | 遊牧咖啡 | 1 | 0.8 |
| 景點餐廳 | 先得月餐廳 | 2 | 1.5 |
| 住宿夥伴 | 映涵渡假飯店 | 5 | 3.0 |
| 住宿夥伴 | 日月行館 | 5 | 3.0 |
| 住宿夥伴 | 朵麗絲的家民宿 | 5 | 3.0 |
| 住宿夥伴 | 向山行館 | 5 | 3.0 |

## 🥖 兌換門檻

| 階段 | 點數 | 獎勵 |
|------|------|------|
| 見習 | 10 | 見習款低碳麵包（1 顆） |
| 完賽 | 20 | 完賽款社會影響力麵包（限量・非賣品） |
| 大使 | 30 | 大使款限定麵包 + 8 折券 |

## 🚀 快速開始

### 本機測試
直接用瀏覽器打開 `index.html` 即可。資料存在 LocalStorage，清除瀏覽器資料即重置。

### 部署到 GitHub Pages
1. 推上 GitHub repo
2. Settings → Pages → 選 main branch
3. 拿到網址（例如 `https://your.github.io/低碳麵包集點/`）

### 正式串接 LINE LIFF
1. 到 [LINE Developers Console](https://developers.line.biz/console/) 建立 Channel
2. 新增 LIFF App，Endpoint URL 填上你的部署網址
3. 打開 `index.html`，取消 LIFF SDK 註解：
   ```html
   <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
   ```
4. 編輯 `assets/app.js`，取消 `initLiff()` 註解，填入你的 LIFF_ID
5. 把 LIFF 連結（`https://liff.line.me/YOUR_LIFF_ID`）放進 LINE OA Rich Menu

## 📱 使用流程

### 遊客端
1. 加入漁光窯烤 LINE OA
2. 點選 Rich Menu「開始集點」→ 打開 LIFF
3. 到合作點掃 QR Code → 自動打卡 + 取得點數
4. 達門檻後在「兌換麵包」頁點擊兌換 → 取得核銷碼
5. 到漁光窯烤門市出示核銷碼領取麵包

### 店家端
1. 打開 `merchant.html`
2. 依分類篩選 → 列印該店的 QR Code
3. 貼在店家結帳櫃台或打卡點
4. 遊客掃碼即打卡（內建同地點防重複）

## 🔌 QR Code 打卡機制

每個地點有唯一 ID（如 `YG-PL`、`EXP-SUP`），QR Code 產生的網址是：
```
https://your-domain.com/index.html?checkin=LOCATION_ID
```
遊客掃碼時，`app.js` 的 `handleUrlCheckIn()` 會自動讀取參數並觸發打卡。

## 📊 點數演算法

```javascript
totalPoints = Σ(每個地點打卡的 points)
balance     = totalPoints - Σ(已兌換 tier.points)
co2Saved    = Σ(每個地點打卡的 co2)
```

防重複打卡：同一 `userId` × 同一 `locationId` 只計一次。

## 🏗️ 正式版後端升級路線

目前 Demo 版用 LocalStorage，正式上線需替換成：

| 模組 | 建議技術 |
|------|---------|
| 會員 | LINE Login + Firebase Auth |
| 資料庫 | Firestore / PostgreSQL |
| API | Cloud Functions / Express |
| QR 動態驗證 | 加入 timestamp + HMAC 簽章 |
| 核銷系統 | 店家後台 + 核銷碼搜尋 API |

## 📄 SBIR 計劃對應

- **技術創新**：碳足跡量化 + LINE 無障礙整合 + QR 動態打卡
- **產業效益**：跨業聯盟（民宿+單車+餐飲+烘焙）首次共用點數系統
- **社會效益**：將減碳行為轉為可量化、可分享的個人成就
- **永續價值**：每顆兌換麵包 = 一次完整低碳旅程證明

---

🥖 **走過 10 個點・兌換一顆有故事的麵包**
