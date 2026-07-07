# ValueSip 🍺

> 今夜どこで飲む？価格から逆算して最適な店を即決できる飲食コスパマップ

## セットアップ

### 1. 依存パッケージをインストール

```bash
npm install
```

### 2. 環境変数を設定

```bash
cp .env.local.example .env.local
```

`.env.local` を開いて Google Maps API キーを設定：

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

> GCP コンソール → API とサービス → 認証情報 で取得  
> 本番環境では必ず HTTP リファラー制限を設定すること

### 3. 開発サーバーを起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開く。

---

## プロジェクト構成

```
src/
├── app/
│   ├── layout.tsx        # HTML レイアウト・メタデータ
│   ├── page.tsx          # メインページ（フィルター状態管理）
│   └── globals.css       # グローバルスタイル・アニメーション
├── components/
│   ├── MapView.tsx        # Google Maps 全画面マップ
│   ├── PricePin.tsx       # マップ上の価格ピン
│   ├── TopSearchBar.tsx   # 上部フローティング検索バー
│   ├── FilterPanel.tsx    # フィルターパネル（スライドダウン）
│   ├── BottomCardStrip.tsx # 下部店舗カードスクロール列
│   └── StoreDetailSheet.tsx # 店舗詳細シート（スライドアップ）
├── data/
│   └── stores.ts          # サンプル店舗データ（渋谷10店舗）
├── lib/
│   └── filters.ts         # フィルタリング・価格計算ロジック
└── types/
    └── store.ts           # TypeScript 型定義
```

## デザイン仕様（確定）

| 要素 | 仕様 |
|------|------|
| レイアウト | フローティングUI型（マップ全画面 + 上部バー + 下部カード） |
| 画面遷移 | 地図先行型（起動→マップ→フィルター→詳細） |
| ブランドカラー | `#378ADD`（青）|
| HHピン | 黒地 × アンバー(`#F59E0B`)文字 |
| 通常ピン | 白地 × ブランド青文字 |
| 予算外ピン | グレー・半透明 |

## 価格定義（確定）

- **1a** メニュー単位（提供価格そのまま）
- **2a** 全メニュー対象（検索ワードで絞る）
- **3a** 検索条件に合うメニューの最安値をピン表示
- **4c** HHトグルで切り替え（デフォルト：HH価格表示）

## 今後の実装

- [ ] Supabase DB 連携（`src/lib/supabase.ts` を作成）
- [ ] 店舗管理画面（`src/app/admin/` ）
- [ ] 月次レポート（M3）
- [ ] スマレジ API 連携（M4）
