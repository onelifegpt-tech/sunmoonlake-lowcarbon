景點參考照（pHash 比對用）

請放入下列 5 張參考照（JPEG，建議解析度 ≥ 800×600）：
  wenwu.jpg      文武廟牌樓正面
  cien.jpg       慈恩塔塔身
  xiangshan.jpg  向山遊客中心清水模建築
  shuishe.jpg    水社碼頭棧道或湖景
  ninefrog.jpg   九蛙疊像（水位雕塑）

驗證鏈：
  1. 讀 EXIF GPS → 距景點 ≤ 半徑（150~200m）→ 通過
  2. 無 GPS → 載入此資料夾參考照 → aHash 8×8 比對 → 漢明距離 ≤ 14 → 通過
  3. 皆不通過 → 進人工覆核佇列 review.html

若參考照缺失，程式自動降級到人工覆核（不會 crash）。
