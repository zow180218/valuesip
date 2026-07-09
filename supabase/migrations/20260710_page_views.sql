-- ─────────────────────────────────────────────────────────────
-- page_views テーブル
-- ユーザーの行動イベントを記録し、オーナー向けアナリティクスに使用する。
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS page_views (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         text        NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  event_type       text        NOT NULL CHECK (
                                 event_type IN ('store_view', 'menu_view', 'map_click', 'phone_tap')
                               ),
  user_fingerprint text,
  -- 集計クエリを高速化するための日本時間での時刻インデックス用カラム
  hour_of_day      smallint    GENERATED ALWAYS AS (
                                 EXTRACT(hour FROM (created_at AT TIME ZONE 'Asia/Tokyo'))::smallint
                               ) STORED,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS page_views_store_created
  ON page_views (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS page_views_event_type
  ON page_views (event_type);

-- RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- 誰でも INSERT 可（ユーザーはログイン不要でイベントを送れる）
CREATE POLICY "page_views: public insert"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- SELECT は RLS で遮断し、サービスロール（API側）のみが集計できるようにする
-- （サービスロールは RLS をバイパスするため追加ポリシー不要）
