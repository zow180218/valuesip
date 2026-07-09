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

  const { data, error } = await supabase
    .from("price_reports")
    .select("*, menus(menu_id, name, price, hh_price, store_id)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[GET /api/admin/reports]", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ reports: (data ?? []) as unknown as ReportWithMenu[] });
}
