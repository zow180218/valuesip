import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/stores/[id]/price-stats
 *
 * store_id に紐づく全メニューの価格報告集計を返す
 * Response: { stats: MenuReportStats[] }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const storeId = params.id;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ stats: [] });
  }

  const supabase = createServiceClient();

  // まず対象店舗のメニューIDを取得
  const { data: menuRows, error: menuErr } = await (supabase.from("menus") as any)
    .select("menu_id")
    .eq("store_id", storeId)
    .eq("is_active", true);

  if (menuErr || !menuRows?.length) {
    return NextResponse.json({ stats: [] });
  }

  const menuIds = (menuRows as { menu_id: string }[]).map((m) => m.menu_id);

  // 価格報告を集計
  const { data: reportRows, error: reportErr } = await (supabase.from("price_reports") as any)
    .select("menu_id, reported_price, created_at")
    .in("menu_id", menuIds)
    .eq("status", "approved"); // 承認済みのみ集計

  if (reportErr) {
    console.error("[price-stats]", reportErr.message);
    return NextResponse.json({ stats: [] });
  }

  const rows = (reportRows ?? []) as {
    menu_id: string;
    reported_price: number;
    created_at: string;
  }[];

  // メニューごとに集計
  const grouped = rows.reduce<Record<string, { prices: number[]; dates: string[] }>>(
    (acc, row) => {
      if (!acc[row.menu_id]) acc[row.menu_id] = { prices: [], dates: [] };
      acc[row.menu_id].prices.push(row.reported_price);
      acc[row.menu_id].dates.push(row.created_at);
      return acc;
    },
    {}
  );

  const stats = menuIds.map((menu_id) => {
    const g = grouped[menu_id];
    if (!g) return { menu_id, report_count: 0, last_reported_at: null, median_price: null };
    const sorted = [...g.prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median_price =
      sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid];
    const last_reported_at = g.dates.sort().at(-1) ?? null;
    return { menu_id, report_count: g.prices.length, last_reported_at, median_price };
  });

  return NextResponse.json({ stats });
}
