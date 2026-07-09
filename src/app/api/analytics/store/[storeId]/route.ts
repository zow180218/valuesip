import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/store/[storeId]?period=7d|30d
//
// 指定店舗の集計アナリティクスを返す。
// サービスロールで page_views を集計。
// ─────────────────────────────────────────────────────────────

export interface StoreAnalytics {
  period: "7d" | "30d";
  total_views: number;
  map_clicks: number;
  phone_taps: number;
  hh_hour_rate: number;       // HH時間帯（17〜19時）のアクセス割合 %
  prev_total_views: number;   // 比較期間の合計（前週/前月）
  daily: { date: string; count: number }[];      // 期間内の日別PV
  hourly: { hour: number; count: number }[];     // 期間内の時間帯別PV
}

export async function GET(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    // ローカル開発用フォールバック
    return NextResponse.json(buildMockData("7d"));
  }

  const { storeId } = params;
  const rawPeriod = req.nextUrl.searchParams.get("period") ?? "7d";
  const period: "7d" | "30d" = rawPeriod === "30d" ? "30d" : "7d";
  const days = period === "7d" ? 7 : 30;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevStart  = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

  // 当期間の全データを取得（最大 5000 件）
  const { data: rows, error } = await supabase
    .from("page_views")
    .select("event_type, hour_of_day, created_at")
    .eq("store_id", storeId)
    .gte("created_at", periodStart.toISOString())
    .order("created_at", { ascending: true })
    .limit(5000);

  if (error) {
    console.error("[analytics/store] select error", error.message);
    return NextResponse.json({ error: "集計に失敗しました" }, { status: 500 });
  }

  // 前期間の合計 PV
  const { count: prevCount } = await supabase
    .from("page_views")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("event_type", "store_view")
    .gte("created_at", prevStart.toISOString())
    .lt("created_at", periodStart.toISOString());

  // 集計
  const storeViews = rows?.filter((r) => r.event_type === "store_view") ?? [];
  const mapClicks  = rows?.filter((r) => r.event_type === "map_click").length ?? 0;
  const phoneTaps  = rows?.filter((r) => r.event_type === "phone_tap").length ?? 0;

  // HH時間帯（17〜19時）のアクセス率
  const hhRows = storeViews.filter(
    (r) => r.hour_of_day >= 17 && r.hour_of_day <= 19
  );
  const hhRate =
    storeViews.length > 0
      ? Math.round((hhRows.length / storeViews.length) * 100)
      : 0;

  // 日別 PV（store_view のみ）
  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    dailyMap[key] = 0;
  }
  for (const r of storeViews) {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    if (key in dailyMap) dailyMap[key]++;
  }
  const daily = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

  // 時間帯別 PV（store_view のみ、0〜23時）
  const hourlyMap: Record<number, number> = {};
  for (let h = 0; h <= 23; h++) hourlyMap[h] = 0;
  for (const r of storeViews) {
    hourlyMap[r.hour_of_day as number]++;
  }
  const hourly = Object.entries(hourlyMap)
    .map(([h, count]) => ({ hour: Number(h), count }))
    .sort((a, b) => a.hour - b.hour);

  const result: StoreAnalytics = {
    period,
    total_views: storeViews.length,
    map_clicks: mapClicks,
    phone_taps: phoneTaps,
    hh_hour_rate: hhRate,
    prev_total_views: prevCount ?? 0,
    daily,
    hourly,
  };

  return NextResponse.json(result);
}

// ローカル開発用モックデータ
function buildMockData(period: "7d" | "30d"): StoreAnalytics {
  const days = period === "7d" ? 7 : 30;
  const now = new Date();
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
    return { date: d.toISOString().slice(0, 10), count: 20 + Math.floor(Math.random() * 60) };
  });
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: h >= 17 && h <= 21 ? 30 + Math.floor(Math.random() * 70) : Math.floor(Math.random() * 10),
  }));
  return {
    period,
    total_views: daily.reduce((s, d) => s + d.count, 0),
    map_clicks: 42,
    phone_taps: 8,
    hh_hour_rate: 61,
    prev_total_views: 180,
    daily,
    hourly,
  };
}
