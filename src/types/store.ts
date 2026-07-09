// ──────────────────────────────────────────────
// ValueSip — Store type definitions
// price-definition.md (1a/2a/3a/4c) に準拠
// data-strategy-shibuya-shinjuku.md のスキーマに準拠
// ──────────────────────────────────────────────

export type AreaId = "shibuya" | "shinjuku";

export type MenuCategory =
  | "beer"        // ビール・生ビール
  | "highball"    // ハイボール
  | "shochu"      // 焼酎・サワー
  | "wine"        // ワイン
  | "cocktail"    // カクテル
  | "soft"        // ソフトドリンク
  | "other";

/** 単品メニュー（menus[]の1要素） */
export interface Menu {
  id: string;
  name: string;               // 例: "角ハイボール"
  category: MenuCategory;
  brand_tag?: string;         // 例: "角", "知多", "一番搾り"
  price: number;              // 通常価格（税込・円）
  hh_price?: number;          // HH価格（税込・円）
  volume_ml?: number;         // 容量（ml）
  smaregi_product_id?: string; // スマレジ商品ID（Webhook価格同期用）
}

/** 店舗レコード */
export interface Store {
  store_id: string;
  name: string;
  area: AreaId;
  address: string;
  lat: number;
  lng: number;
  menus: Menu[];
  hh_available: boolean;
  hh_time?: string;           // 例: "17:00〜19:00"
  data_updated_at: string;    // ISO 8601 date string
  smaregi_id?: string;
  phone?: string;
  seats?: number;
  open_hours?: string;   // 例: "17:00〜24:00（L.O. 23:30）"
  closed_days?: string;  // 例: "月曜日" / "不定休" / "年中無休"
}

/** フィルター状態 */
export interface FilterState {
  searchText: string;     // メニュー検索ワード
  excludeText: string;    // 除外ワード
  minBudget: number;      // 予算下限（円）
  maxBudget: number;      // 予算上限（円）
  hhEnabled: boolean;     // HH価格を使用するか（true = HH価格優先）
}

/** ピン表示用の計算済みデータ */
export interface StorePinData {
  store: Store;
  effectivePrice: number;   // 表示する価格（HHトグル状態に応じた最安値）
  isHH: boolean;            // HH価格が適用されているか
  isInBudget: boolean;      // 予算内か
  matchCount: number;       // 検索ワードに一致するメニュー数
}
