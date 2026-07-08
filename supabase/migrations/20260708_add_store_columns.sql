-- ============================================================
-- ValueSip Migration: 2026-07-08
-- stores / menus テーブルへのカラム追加
-- ============================================================

-- ① stores テーブルに席数・営業時間・定休日を追加
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS seats        INTEGER,
  ADD COLUMN IF NOT EXISTS open_hours   TEXT,
  ADD COLUMN IF NOT EXISTS closed_days  TEXT;

COMMENT ON COLUMN stores.seats       IS '席数（目安）';
COMMENT ON COLUMN stores.open_hours  IS '営業時間テキスト（例: 17:00〜24:00（L.O. 23:30））';
COMMENT ON COLUMN stores.closed_days IS '定休日テキスト（例: 月曜日 / 不定休 / 年中無休）';

-- ② menus テーブルにスマレジ商品IDを追加（Webhook連携用）
ALTER TABLE menus
  ADD COLUMN IF NOT EXISTS smaregi_product_id TEXT;

COMMENT ON COLUMN menus.smaregi_product_id IS 'スマレジ商品ID（Webhook価格同期用）。NULL=手動管理。';

-- ③ smaregi_product_id の検索用インデックス
CREATE INDEX IF NOT EXISTS idx_menus_smaregi_product_id
  ON menus (smaregi_product_id)
  WHERE smaregi_product_id IS NOT NULL;

-- ④ stores.smaregi_id 用インデックス（既存カラム・なければスキップ）
CREATE INDEX IF NOT EXISTS idx_stores_smaregi_id
  ON stores (smaregi_id)
  WHERE smaregi_id IS NOT NULL;
