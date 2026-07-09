-- ──────────────────────────────────────────────────────────────
-- Migration: 価格投票・価格報告テーブル
-- 実行先: Supabase SQL Editor (project: jgmnvpywaxhrzwmewrjx)
-- 作成日: 2026-07-09
-- ──────────────────────────────────────────────────────────────

-- ── price_votes テーブル ─────────────────────────────────────
-- ユーザーがメニュー価格の正確さに投票する
-- user_fingerprint: localStorage 永続化の匿名ID（要ログイン不要）
CREATE TABLE IF NOT EXISTS price_votes (
  vote_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id          UUID NOT NULL REFERENCES menus(menu_id) ON DELETE CASCADE,
  user_fingerprint TEXT NOT NULL,
  is_accurate      BOOLEAN NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 同一ユーザーは同一メニューに1票のみ（upsert で上書き可）
CREATE UNIQUE INDEX IF NOT EXISTS price_votes_unique_idx
  ON price_votes (menu_id, user_fingerprint);

-- RLS: 誰でも読める、書き込みも匿名可
ALTER TABLE price_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_votes: anyone can read"
  ON price_votes FOR SELECT
  USING (true);

CREATE POLICY "price_votes: anyone can insert or update"
  ON price_votes FOR INSERT
  WITH CHECK (true);

-- ── price_reports テーブル ───────────────────────────────────
-- ユーザーが実際に見た価格を報告する
-- status: pending（審査待ち）/ approved（承認済み）/ rejected（却下）
CREATE TABLE IF NOT EXISTS price_reports (
  report_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id            UUID NOT NULL REFERENCES menus(menu_id) ON DELETE CASCADE,
  reported_price     INTEGER NOT NULL CHECK (reported_price > 0 AND reported_price <= 99999),
  reported_hh_price  INTEGER CHECK (reported_hh_price IS NULL OR (reported_hh_price > 0 AND reported_hh_price <= 99999)),
  note               TEXT,
  user_fingerprint   TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS price_reports_menu_id_idx
  ON price_reports (menu_id, status, created_at DESC);

-- RLS: 誰でも読める、書き込みも匿名可
ALTER TABLE price_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_reports: anyone can read pending"
  ON price_reports FOR SELECT
  USING (status = 'pending');

CREATE POLICY "price_reports: anyone can insert"
  ON price_reports FOR INSERT
  WITH CHECK (true);
