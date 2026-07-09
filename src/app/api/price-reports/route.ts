import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
// POST /api/price-reports
//
// ユーザーが価格報告を送信する
// status は "pending"（管理者承認待ち）で作成
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: {
    menu_id: string;
    reported_price: number;
    reported_hh_price?: number | null;
    note?: string;
    fingerprint: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { menu_id, reported_price, reported_hh_price, note, fingerprint } = body;

  if (!menu_id || !reported_price || !fingerprint) {
    return NextResponse.json(
      { error: "menu_id, reported_price, fingerprint は必須です" },
      { status: 400 }
    );
  }

  if (reported_price <= 0 || reported_price > 99999) {
    return NextResponse.json({ error: "価格は 1〜99,999 円で入力してください" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ reported: true, _dev: true });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("price_reports")
    .insert({
      menu_id,
      reported_price,
      reported_hh_price: reported_hh_price ?? null,
      note: note?.trim() || null,
      user_fingerprint: fingerprint,
      status: "pending",
    })
    .select("report_id")
    .single();

  if (error) {
    console.error("[POST /api/price-reports]", error);
    return NextResponse.json({ error: "報告の保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ reported: true, report_id: data.report_id });
}
