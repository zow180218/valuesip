import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
// GET /api/admin/reports
//
// pending ステータスの価格報告一覧をメニュー情報付きで返す。
// 管理者が価格修正申請をレビューするための API。
// ─────────────────────────────────────────────────────────────

export interface ReportWithMenu {
  report_id: string;
  menu_id: string;
  reported_price: number;
  reported_hh_price: number | null;
  note: string | null;
  user_fingerprint: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  menus: {
    menu_id: string;
    name: string;
    price: number;
    hh_price: number | null;
    store_id: string;
  } | null;
}

export async function GET() {
  // ローカル開発フォールバック
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ reports: [], _dev: true });
  }

  const supabase = createServiceClient();

  // Step 1: pending の price_reports を取得
  const { data: reports, error: reportsError } = await supabase
    .from("price_reports")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  if (reportsError) {
    console.error("[GET /api/admin/reports] reports fetch error", reportsError);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }

  if (!reports || reports.length === 0) {
    return NextResponse.json({ reports: [] });
  }

  // Step 2: 関連するメニュー情報を取得
  const menuIds = Array.from(new Set(reports.map((r) => r.menu_id)));
  const { data: menus, error: menusError } = await supabase
    .from("menus")
    .select("menu_id, name, price, hh_price, store_id")
    .in("menu_id", menuIds);

  if (menusError) {
    console.error("[GET /api/admin/reports] menus fetch error", menusError);
    // メニュー取得失敗時も reports は返す（menus を null にして）
  }

  // Step 3: アプリケーション側で結合
  const result: ReportWithMenu[] = reports.map((r) => ({
    ...r,
    menus: menus?.find((m) => m.menu_id === r.menu_id) ?? null,
  }));

  console.info(`[GET /api/admin/reports] found ${result.length} pending reports`);

  return NextResponse.json({ reports: result });
}
