import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
// GET /api/votes?menu_id=<uuid>
//
// 指定メニューの投票集計を返す
// ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const menuId = searchParams.get("menu_id");

  if (!menuId) {
    return NextResponse.json({ error: "menu_id が必要です" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // ローカル開発: ダミーデータを返す
    return NextResponse.json({
      ok_count: 18,
      ng_count: 5,
      total: 23,
      accuracy_pct: 78,
      recent_reports: [],
    });
  }

  const supabase = createServiceClient();

  const { data: votes, error } = await supabase
    .from("price_votes")
    .select("is_accurate, created_at")
    .eq("menu_id", menuId);

  if (error) {
    console.error("[GET /api/votes]", error);
    return NextResponse.json({ error: "投票取得に失敗しました" }, { status: 500 });
  }

  const ok_count = votes?.filter((v) => v.is_accurate).length ?? 0;
  const ng_count = votes?.filter((v) => !v.is_accurate).length ?? 0;
  const total = (votes?.length ?? 0);
  const accuracy_pct = total > 0 ? Math.round((ok_count / total) * 100) : null;

  // 直近の価格報告（承認済みのみ）
  const { data: reports } = await supabase
    .from("price_reports")
    .select("reported_price, reported_hh_price, note, created_at")
    .eq("menu_id", menuId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    ok_count,
    ng_count,
    total,
    accuracy_pct,
    recent_reports: reports ?? [],
  });
}

// ─────────────────────────────────────────────────────────────
// POST /api/votes
//
// 投票を登録（upsert: 同一 fingerprint + menu_id は上書き）
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: { menu_id: string; is_accurate: boolean; fingerprint: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { menu_id, is_accurate, fingerprint } = body;

  if (!menu_id || is_accurate === undefined || !fingerprint) {
    return NextResponse.json(
      { error: "menu_id, is_accurate, fingerprint は必須です" },
      { status: 400 }
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ voted: true, _dev: true });
  }

  const supabase = createServiceClient();

  // upsert: 同じユーザーが同じメニューに再投票したら上書き
  const { error } = await supabase
    .from("price_votes")
    .upsert(
      {
        menu_id,
        user_fingerprint: fingerprint,
        is_accurate,
      },
      { onConflict: "menu_id,user_fingerprint" }
    );

  if (error) {
    console.error("[POST /api/votes]", error);
    return NextResponse.json({ error: "投票の保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ voted: true });
}
