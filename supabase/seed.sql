-- ValueSip: Seed Data（渋谷サンプル10店舗）
-- supabase db seed で実行、または Supabase Dashboard > SQL Editor で実行

-- ─────────────────────────────────────────────
-- 店舗データ
-- ─────────────────────────────────────────────
INSERT INTO stores (store_id, area_id, name, address, lat, lng, hh_hours, is_active, verified) VALUES
  ('shib-001', 'shibuya', '道玄坂ビアホール',     '渋谷区道玄坂1-1-1',  35.6591, 139.6983, 'HH 17:00–19:00', true, false),
  ('shib-002', 'shibuya', 'センター街立ち飲みバル','渋谷区宇田川町1-2',  35.6612, 139.6992, 'HH 18:00–20:00', true, false),
  ('shib-003', 'shibuya', '渋谷スタンドバー',     '渋谷区渋谷2-2-2',    35.6600, 139.7020, NULL,             true, false),
  ('shib-004', 'shibuya', '道玄坂かわら版',       '渋谷区道玄坂2-3-4',  35.6578, 139.6975, 'HH 17:00–20:00', true, false),
  ('shib-005', 'shibuya', '宇田川酒場',           '渋谷区宇田川町5-6',  35.6625, 139.6980, NULL,             true, false),
  ('shib-006', 'shibuya', '渋谷横丁角打ち',       '渋谷区渋谷1-5-3',    35.6572, 139.7005, 'HH 16:00–18:00', true, false),
  ('shib-007', 'shibuya', '円山町バル',           '渋谷区円山町7-8',    35.6562, 139.6968, NULL,             true, false),
  ('shib-008', 'shibuya', '松濤サザエ',           '渋谷区松濤1-9-10',   35.6598, 139.6950, 'HH 17:00–19:30', true, false),
  ('shib-009', 'shibuya', '南平台ビストロ',       '渋谷区南平台町2-11', 35.6554, 139.6990, NULL,             true, false),
  ('shib-010', 'shibuya', '桜丘ハングアウト',     '渋谷区桜丘町12-13',  35.6540, 139.7008, 'HH 17:00–20:00', true, false)
ON CONFLICT (store_id) DO NOTHING;

-- ─────────────────────────────────────────────
-- メニューデータ
-- ─────────────────────────────────────────────
INSERT INTO menus (store_id, name, category, brand_tag, price, hh_price, volume_ml) VALUES
  -- shib-001 道玄坂ビアホール
  ('shib-001', '生ビール（中）',     'beer',     'サッポロ', 620, 480, 400),
  ('shib-001', 'ハイボール',         'highball',  'サントリー', 550, 420, 300),
  ('shib-001', 'チューハイ',         'cocktail',  NULL,       480, NULL, 350),

  -- shib-002 センター街立ち飲みバル
  ('shib-002', '生ビール（小）',     'beer',     'アサヒ',   380, 300, 250),
  ('shib-002', '角ハイボール',       'highball',  '角瓶',     480, 380, 300),
  ('shib-002', '日本酒（一合）',     'shochu',    NULL,       550, NULL, 180),

  -- shib-003 渋谷スタンドバー
  ('shib-003', 'クラフトビール（P）','beer',     NULL,       750, NULL, 300),
  ('shib-003', 'ハイボール',         'highball',  'ニッカ',   600, NULL, 300),
  ('shib-003', '赤ワイン（グラス）', 'wine',      NULL,       680, NULL, 120),

  -- shib-004 道玄坂かわら版
  ('shib-004', '生ビール（中）',     'beer',     'キリン',   580, 380, 400),
  ('shib-004', '焼酎ロック',         'shochu',    '黒霧島',   480, 350, NULL),
  ('shib-004', 'ハイボール',         'highball',  'ブラックニッカ', 520, 350, 300),

  -- shib-005 宇田川酒場
  ('shib-005', '生ビール（大）',     'beer',     'サッポロ', 750, NULL, 500),
  ('shib-005', 'ハイボール',         'highball',  '角瓶',     550, NULL, 300),
  ('shib-005', 'コーラ',             'soft',      NULL,       300, NULL, NULL),

  -- shib-006 渋谷横丁角打ち
  ('shib-006', '瓶ビール（中）',     'beer',     'アサヒ',   520, 380, 350),
  ('shib-006', '日本酒（半合）',     'shochu',    '獺祭',     680, 500, 90),
  ('shib-006', 'ハイボール',         'highball',  'サントリー', 480, 350, 300),

  -- shib-007 円山町バル
  ('shib-007', '生ビール',           'beer',     'ハートランド', 680, NULL, 380),
  ('shib-007', '白ワイン（グラス）', 'wine',      NULL,       720, NULL, 120),
  ('shib-007', 'サングリア',         'cocktail',  NULL,       780, NULL, 200),

  -- shib-008 松濤サザエ
  ('shib-008', '生ビール（中）',     'beer',     'エビス',   700, 500, 400),
  ('shib-008', 'ハイボール',         'highball',  'トリス',   520, 380, 300),
  ('shib-008', '焼酎水割り',         'shochu',    '二階堂',   480, 360, NULL),

  -- shib-009 南平台ビストロ
  ('shib-009', 'クラフトビール',     'beer',     NULL,       820, NULL, 330),
  ('shib-009', '赤ワイン',           'wine',      NULL,       750, NULL, 125),
  ('shib-009', 'スパークリング',     'wine',      NULL,       780, NULL, 120),

  -- shib-010 桜丘ハングアウト
  ('shib-010', '生ビール（中）',     'beer',     'キリン',   600, 400, 400),
  ('shib-010', 'ハイボール',         'highball',  '知多',     580, 420, 300),
  ('shib-010', 'カクテル',           'cocktail',  NULL,       650, 480, 200)
ON CONFLICT DO NOTHING;
