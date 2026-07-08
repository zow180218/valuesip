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
│   ├── layout.tsx              # HTML レイアウト・メタデータ
│   ├── page.tsx                # メインページ（地図・フィルター状態管理）
│   ├── globals.css             # グローバルスタイル・アニメーション
│   ├── api/stores/route.ts     # GET /api/stores（Supabase未接続時はサンプルデータにフォールバック）
│   ├── stores/[id]/page.tsx    # 店舗詳細ページ（基本情報／メニュー タブ切替）
│   └── owner/                  # 店舗オーナー向け管理画面（README旧版で「未着手」としていたが実装済み）
│       ├── layout.tsx          # ログインガード + ナビ
│       ├── login/page.tsx      # デモ認証ログイン（本番はSupabase Authに置換要）
│       ├── dashboard/page.tsx  # 概要ダッシュボード（週間PV・POS同期通知）
│       ├── stores/[id]/edit/page.tsx  # 店舗基本情報編集
│       ├── stores/[id]/menu/page.tsx  # メニューCRUD・POS同期（デモ）
│       ├── pos/page.tsx        # POS連携設定（Square/スマレジ/Airレジ/CSV/手動）
│       └── analytics/page.tsx  # アクセス分析（PV・ファネル・流入元）
├── components/
│   ├── MapView.tsx         # Google Maps 全画面マップ（@vis.gl/react-google-maps）
│   ├── PricePin.tsx        # マップ上の価格ピン
│   ├── TopSearchBar.tsx    # 上部フローティング検索バー
│   ├── FilterPanel.tsx     # フィルターパネル（除外ワード＋予算上下限、スライドダウン）
│   ├── BottomCardStrip.tsx # 下部店舗カードスクロール列
│   ├── StoreDetailSheet.tsx # 店舗詳細シート（スライドアップ）
│   └── owner/OwnerNav.tsx  # オーナー管理画面の共通ナビ
├── data/
│   └── stores.ts           # サンプル店舗データ（渋谷10店舗）
├── lib/
│   ├── filters.ts          # フィルタリング・価格計算ロジック
│   └── supabase.ts         # Supabaseクライアント（anon / service_role）
└── types/
    ├── store.ts            # アプリ内で使うStore/Menu/FilterState等の型
    └── database.ts         # Supabaseスキーマ型（手動定義・DB接続後に自動生成へ置換）
```

> 2026-07-08時点で上記はすべて実装済み。フロントエンドはSupabase未接続でもサンプルデータで完全動作する設計。

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

- [ ] Supabase プロジェクト作成・環境変数設定（コード側は`src/lib/supabase.ts`実装済み、未接続時はサンプルデータにフォールバック）
- [ ] `src/app/owner/login` の認証をSupabase Authに置換（現状デモ用ハードコード認証）
- [ ] `src/app/owner/stores/[id]/edit` `menu` の保存処理をAPI Route（PATCH）に接続（現状ローカルstateのみ・リロードで消える）
- [ ] POS連携を実データに接続：`src/app/owner/pos/page.tsx`のデフォルト表示が「Square連携済み」になっているが、事業計画上の連携先はスマレジ（M4）。表示の初期状態を見直すか要判断
- [ ] 月次レポート（M3・`ValueSip_月次レポート_サンプル.html`のデータをanalytics/page.tsxと接続）
- [ ] スマレジ API 連携（M4）
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` の本番用Map ID発行（GCP Map Management）
