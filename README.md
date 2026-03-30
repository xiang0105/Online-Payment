# Online Payment Demo (EasySplit)

以 Expo + React Native 建置的行動支付示範專案，包含：

- Supabase 帳號系統（註冊、登入、Session）
- 交易 PIN 與生物辨識登入
- 信用卡與銀行帳戶管理
- 掃碼付款與收款 QR Code
- 交易紀錄、分類與統計圖表
- 地圖定位頁（位置權限）

## 功能總覽

### 1) 驗證與安全流程

- Email/Password 註冊登入（Supabase Auth）
- 首次登入導向設定 6 碼交易 PIN
- App 冷啟動時優先 PIN 驗證
- 支援 Face ID / 指紋驗證（expo-local-authentication）
- 敏感資料使用 SecureStore 儲存（例如 PIN 設定旗標）

### 2) 支付與收款

- 掃描 QR Code 進入付款確認流程
- 產生個人收款碼（QR）供他人掃描
- 可選擇 Wallet 或信用卡支付
- 付款成功頁可直接調整交易分類

### 3) 資產與交易管理

- 信用卡新增、管理、交易寫入與可用額度扣減
- 銀行帳戶新增與餘額更新
- 分類管理（內建 + 自訂，儲存於 AsyncStorage）
- 交易明細頁可更新交易分類

### 4) 分析與視覺化

- 支出統計圖表（react-native-chart-kit）
- 卡片頁含條碼顯示與額度視覺化

## 技術棧

- Expo SDK 54
- React Native 0.81
- Expo Router（檔案路由）
- Supabase（Auth + Postgres + Realtime）
- TypeScript

主要套件：

- expo-camera
- expo-location
- expo-local-authentication
- expo-secure-store
- react-native-maps
- react-native-qrcode-svg
- react-native-barcode-svg
- react-native-chart-kit

## 專案結構

```text
app/
   (tabs)/
      index.tsx          # 首頁/卡片總覽
      scan.tsx           # 掃碼與收款碼
      accounting.tsx     # 交易統計
      map.tsx            # 地圖定位
      list.tsx           # 清單頁
   login.tsx
   register.tsx
   pin-login.tsx
   set-transaction-pin.tsx
   confirm-payment.tsx
   payment-success.tsx
   transaction-details.tsx

context/
   UserContext.tsx      # 使用者、session、主題色
   CardContext.tsx      # 卡片與交易
   BankContext.tsx      # 銀行帳戶
   CategoryContext.tsx  # 交易分類

lib/
   supabase.ts          # Supabase Client
```

## 環境需求

- Node.js 18+
- npm 9+
- Expo CLI（透過 npx expo 使用即可）

## 安裝與啟動

1. 安裝依賴

```bash
npm install
```

1. 建立環境變數檔案（建議使用 `.env`）

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

1. 啟動開發伺服器

```bash
npm run start
```

常用指令：

```bash
npm run android
npm run ios
npm run web
npm run lint
```

## Supabase 資料與權限建議

專案程式碼已使用到下列資料實體，請在 Supabase 建立對應 schema 與 RLS policy：

- profiles
- cards
- transactions
- bank_accounts

另外程式中有呼叫 RPC：

- increment_balance_by_phone

建議為每張表設定「僅允許使用者存取自己的資料」的 RLS 規則（以 user_id 或 id 對 auth.uid() 比對）。

## 權限需求

- 相機權限：掃描 QR Code
- 位置權限：地圖定位
- 生物辨識：Face ID / 指紋登入

## 注意事項

- 若缺少 Supabase 環境變數，App 會在啟動時拋出錯誤。
- PIN 與登入轉導邏輯由根佈局的導航守門機制統一處理。

## 授權

此專案目前未附加授權條款，若要公開散佈，建議補上 LICENSE。
