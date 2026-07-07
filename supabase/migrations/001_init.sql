-- ValueSip: Initial Schema
-- Migration: 001_init.sql
-- Created: 2026-07-07

-- ─────────────────────────────────────────────
-- エリアマスタ
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS areas (
  area_id   TEXT PRIMARY KEY,           -- 'shibuya' | 'shinjuku'
  name      TEXT NOT NULL,              -- '渋谷'
  lat       DOUBLE PRECISION NOT NULL,
  lng       DOUBLE PRECISION NOT NULL,
  zoom      INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO areas (area_id, name, lat, lng, zoom) VALUES
  ('shibuya', '渋谷', 35.6580, 139.7016, 15),
  ('shinjuku', '新宿', 35.6896, 139.7006, 15)
ON CONFLICT (area_id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 店舗
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  store_id    TEXT PRIMARY KEY,           -- 'shib-001'
  area_id     TEXT NOT NULL REFERENCES areas(area_id),
  name        TEXT NOT NULL,
  address     TEXT,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  google_place_id  TEXT,                  -- Google Maps Place ID
  opening_hours    JSONB,                 -- { mon: "17:00-24:00", ... }
  hh_hours         TEXT,                  -- 'HH 17:00-19:00' (表示用テキスト)
  phone       TEXT,
  website_url TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  verified    BOOLEAN NOT NULL DEFAULT false, -- 店舗オーナー確認済み
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stores_area_id_idx ON stores(area_id);
CREATE INDEX IF NOT EXISTS stores_lat_lng_idx ON stores(lat, lng);

-- ─────────────────────────────────────────────
-- メニュー
-- ─────────────────────────────────────────────
CREATE TYPE menu_category AS ENUM (
  'beer', 'highball', 'shochu', 'wine', 'cocktail', 'soft', 'other'
);

CREATE TABLE IF NOT EXISTS menus (
  menu_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    TEXT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  name        TEXT NOT NULL,              -- '生ビール（中）'
  category    menu_category NOT NULL,
  brand_tag   TEXT,                       -- 'サッポロ', 'サントリー' etc.
  price       INTEGER NOT NULL,           -- 通常価格（円、税込）
  hh_price    INTEGER,                    -- HH価格（NULL = HH設定なし）
  volume_ml   INTEGER,                    -- 容量（任意）
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS menus_store_id_idx ON menus(store_id);
CREATE INDEX IF NOT EXISTS menus_category_idx ON menus(category);
CREATE INDEX IF NOT EXISTS menus_price_idx ON menus(price);

-- ─────────────────────────────────────────────
-- updated_at 自動更新トリガー
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER menus_updated_at
  BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

ALTER TABLE areas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus  ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能（地図表示に必要）
CREATE POLICY "areas: public read"
  ON areas FOR SELECT USING (true);

CREATE POLICY "stores: public read active stores"
  ON stores FOR SELECT USING (is_active = true);

CREATE POLICY "menus: public read active menus"
  ON menus FOR SELECT USING (is_active = true);

-- 書き込みは service_role のみ（管理画面からのみ更新可能）
-- ※ anon / authenticated ロールには INSERT/UPDATE/DELETE を付与しない
