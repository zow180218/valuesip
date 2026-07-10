-- ─────────────────────────────────────────────────────────────
-- Migration: RLS + Supabase Auth + Verified Badge
-- ⑦ stores.verified_at 追加
-- ⑩ owner_store_map テーブル, RLS ポリシー
-- ─────────────────────────────────────────────────────────────

-- ① stores に verified_at を追加（verified は既存カラム）
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- ② オーナー↔店舗マッピングテーブル
CREATE TABLE IF NOT EXISTS owner_store_map (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id   TEXT        NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

CREATE INDEX IF NOT EXISTS owner_store_map_user ON owner_store_map (user_id);
CREATE INDEX IF NOT EXISTS owner_store_map_store ON owner_store_map (store_id);

-- ③ RLS 有効化（stores / menus はまだ未有効の場合に備え）
ALTER TABLE stores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus           ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_store_map ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- stores ポリシー
-- ─────────────────────────────────────────────────────────────

-- 公開 SELECT（is_active=true のみ：API が WHERE is_active=true を付けているが念のため）
DROP POLICY IF EXISTS "stores: public select" ON stores;
CREATE POLICY "stores: public select"
  ON stores FOR SELECT
  USING (is_active = true);

-- オーナーは自分の店舗を UPDATE 可能
DROP POLICY IF EXISTS "stores: owner update" ON stores;
CREATE POLICY "stores: owner update"
  ON stores FOR UPDATE
  USING (
    store_id IN (
      SELECT store_id FROM owner_store_map WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM owner_store_map WHERE user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- menus ポリシー
-- ─────────────────────────────────────────────────────────────

-- 公開 SELECT（is_active=true）
DROP POLICY IF EXISTS "menus: public select" ON menus;
CREATE POLICY "menus: public select"
  ON menus FOR SELECT
  USING (is_active = true);

-- オーナーは自分の店舗のメニューを全操作可能
DROP POLICY IF EXISTS "menus: owner all" ON menus;
CREATE POLICY "menus: owner all"
  ON menus FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM owner_store_map WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM owner_store_map WHERE user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- owner_store_map ポリシー（本人のみ参照可）
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "owner_store_map: self select" ON owner_store_map;
CREATE POLICY "owner_store_map: self select"
  ON owner_store_map FOR SELECT
  USING (user_id = auth.uid());

-- 管理者（service_role）は RLS バイパスで直接 INSERT するため追加ポリシー不要
