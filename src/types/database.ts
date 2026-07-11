/**
 * Supabase Database 型定義
 * 最終更新: 2026-07-09（Relationships[] 追加 + price_votes / price_reports 追加）
 */
export type MenuCategory = "beer" | "highball" | "shochu" | "wine" | "cocktail" | "soft" | "other";

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: { area_id: string; name: string; lat: number; lng: number; zoom: number; created_at: string; };
        Insert: Omit<Database["public"]["Tables"]["areas"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["areas"]["Insert"]>;
        Relationships: [];
      };
      stores: {
        Row: {
          store_id: string; area_id: string; name: string; address: string | null;
          lat: number; lng: number; google_place_id: string | null;
          opening_hours: Record<string, string> | null; open_hours: string | null;
          closed_days: string | null; hh_hours: string | null; phone: string | null;
          website_url: string | null; seats: number | null; smaregi_id: string | null;
          is_active: boolean; verified: boolean; verified_at: string | null;
          created_at: string; updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["stores"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["stores"]["Insert"]> & { updated_at?: string; };
        Relationships: [];
      };
      owner_store_map: {
        Row: {
          id: string; user_id: string; store_id: string; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["owner_store_map"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["owner_store_map"]["Insert"]>;
        Relationships: [];
      };
      menus: {
        Row: {
          menu_id: string; store_id: string; name: string; category: MenuCategory;
          brand_tag: string | null; price: number; hh_price: number | null;
          volume_ml: number | null; smaregi_product_id: string | null;
          is_active: boolean; created_at: string; updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["menus"]["Row"], "menu_id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["menus"]["Insert"]> & { updated_at?: string; };
        Relationships: [];
      };
      price_votes: {
        Row: {
          vote_id: string;
          menu_id: string;
          user_fingerprint: string;
          is_accurate: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["price_votes"]["Row"], "vote_id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["price_votes"]["Insert"]>;
        Relationships: [];
      };
      price_reports: {
        Row: {
          report_id: string;
          menu_id: string;
          reported_price: number;
          reported_hh_price: number | null;
          note: string | null;
          user_fingerprint: string;
          status: "pending" | "approved" | "rejected";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["price_reports"]["Row"], "report_id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["price_reports"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_stores_by_area: {
        Args: { p_area_id: string };
        Returns: Array<{
          store_id: string;
          area_id: string;
          name: string;
          address: string | null;
          lat: number;
          lng: number;
          google_place_id: string | null;
          opening_hours: Record<string, string> | null;
          hh_hours: string | null;
          phone: string | null;
          website_url: string | null;
          is_active: boolean;
          verified: boolean;
          created_at: string;
          updated_at: string;
        }>;
      };
    };
    Enums: { menu_category: MenuCategory; };
  };
}
