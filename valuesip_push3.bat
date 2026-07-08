@echo off
cd /d "C:\Users\user\Claude\Projects\ValueCip"

echo === git status ===
"C:\Program Files\Git\cmd\git.exe" status

echo === git add ===
"C:\Program Files\Git\cmd\git.exe" add src/app/api/owner/stores src/app/api/webhooks src/app/owner/stores src/types/database.ts supabase/migrations/20260708_add_store_columns.sql .env.local.example

echo === git commit ===
"C:\Program Files\Git\cmd\git.exe" commit -m "feat: Supabase PATCH API + Smaregi Webhook"

echo === git push ===
"C:\Program Files\Git\cmd\git.exe" push origin main

echo.
echo === 完了 ===
pause
