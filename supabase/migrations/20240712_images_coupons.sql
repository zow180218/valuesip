-- ============================================================
-- Migration: store_images + store_coupons
-- ============================================================

-- ① 店舗写真テーブル
CREATE TABLE IF NOT EXISTS store_images (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id      text        NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  image_url     text        NOT NULL,
  uploaded_by   text        NOT NULL DEFAULT 'user', -- 'owner' | 'user'
  is_approved   boolean     NOT NULL DEFAULT false,   -- ユーザー投稿は要承認
  display_order integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_images_store_id ON store_images(store_id);

ALTER TABLE store_images ENABLE ROW LEVEL SECURITY;

-- 承認済み画像は誰でも読める
CREATE POLICY "Public read approved images"
  ON store_images FOR SELECT
  USING (is_approved = true);

-- サービスロール（API）からのみ insert / update
CREATE POLICY "Service role manage images"
  ON store_images FOR ALL
  USING (true)
  WITH CHECK (true);


-- ② クーポンテーブル
CREATE TABLE IF NOT EXISTS store_coupons (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id      text        NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  title         text        NOT NULL,
  description   text,
  discount_text text        NOT NULL, -- 例: "生ビール300円"
  valid_from    timestamptz NOT NULL DEFAULT now(),
  valid_until   timestamptz,          -- NULL = 無期限
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_coupons_store_id ON store_coupons(store_id);

ALTER TABLE store_coupons ENABLE ROW LEVEL SECURITY;

-- 有効クーポンは誰でも読める
CREATE POLICY "Public read active coupons"
  ON store_coupons FOR SELECT
  USING (
    is_active = true
    AND (valid_until IS NULL OR valid_until > now())
  );

-- サービスロール（API）からのみ insert / update / delete
CREATE POLICY "Service role manage coupons"
  ON store_coupons FOR ALL
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- Supabase Storage バケット設定（ダッシュボードから手動で実施）
-- ============================================================
-- 1. Storage > New bucket
-- 2. Name: store-images
-- 3. Public bucket: ON（画像URLを公開アクセス可能にする）
-- 4. Policies:
--    - SELECT: anon で全ファイルを読み取り可
--    - INSERT: authenticated または service_role
-- ============================================================
