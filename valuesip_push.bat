@echo off
cd /d "C:\Users\user\Claude\Projects\ValueCip"
echo === git add ===
git add src/app/api/owner/stores src/app/api/webhooks src/app/owner/stores src/types/database.ts supabase/migrations/20260708_add_store_columns.sql .env.local.example
echo === git commit ===
git commit -m "feat: Supabase PATCH API + Smaregi Webhook

- PATCH /api/owner/stores/[id]: Supabase書き込み実装
- POST /api/webhooks/smaregi: HMAC検証+HH判定+価格同期
- edit/page.tsx: 実API呼び出し+エラー表示
- DB migration: seats/open_hours/closed_days/smaregi_product_id追加
- database.ts: 型定義更新"
echo === git push ===
git push origin main
echo.
echo === 完了しました ===
pause
