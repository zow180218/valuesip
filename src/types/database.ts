/**
 * Supabase Database 型定義
 * 本来は `supabase gen types typescript` で自動生成するが、
 * 手動で定義しておき、DB接続後に置き換える。
 *
 * 最終更新: 2026-07-08（seats / open_hours / closed_days / smaregi_product_id 追加）
 */

export type MenuCategory =
  | "beer"
  | "highball"
  | "shochu"
  | "wine"
  | "cocktail"
  | "soft"
  | "other";

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: {
          area_id: string;
          name: string;
          lat: number;
          lng: number;
          zoom: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["areas"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["areas"]["Insert"]>;
      };
      stores: {
        Row: {
          store_id: string;
          area_id: string;
          name: string;
          address: string | null;
          lat: number;
          lng: number;
          google_place_id: string | null;
          opening_hours: Record<string, string> | null; // 将来の構造化営業時間（JSONB）
          open_hours: string | null;   // 表示用・自由テキスト（例: "17:00〜24:00（L.O. 23:30）"）
          closed_days: string | null;  // 定休日テキスト（例: "月曜日" / "不定休"）
          hh_hours: string | null;
          phone: string | null;
          website_url: string | null;
          seats: number | null;        // 席数（目安）
          smaregi_id: string | null;   // スマレジ店舗ID（Webhook連携用）
          is_active: boolean;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["stores"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["stores"]["Insert"]> & {
          updated_at?: string;
        };
      };
      menus: {
        Row: {
          menu_id: string;
          store_id: string;
          name: string;
          category: MenuCategory;
          brand_tag: string | null;
          price: number;
          hh_price: number | null;
          volume_ml: number | null;
          smaregi_product_id: string | null; // スマレジ商品ID（Webhook価格同期用）
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["menus"]["Row"],
          "menu_id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["menus"]["Insert"]> & {
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      menu_category: MenuCategory;
    };
  };
}
