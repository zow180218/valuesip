@echo off
chcp 65001 > nul
cd /d "C:\Users\user\Claude\Projects\ValueCip"
echo.
echo === 現在のgit状態 ===
git status
echo.
echo === git add ===
git add src/app/api/owner/stores src/app/api/webhooks src/app/owner/stores src/types/database.ts supabase/migrations/20260708_add_store_columns.sql .env.local.example
echo.
echo === git commit ===
git commit -m "feat: Supabase PATCH API + Smaregi Webhook"
echo.
echo === git push ===
git push origin main
echo.
echo === 完了 ===
pause
