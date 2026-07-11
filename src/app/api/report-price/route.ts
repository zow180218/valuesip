import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/report-price
 *
 * Body: { store_id: string; menu_id: string; reported_price: number; note?: string }
 *
 * ユーザーからの価格報告を price_reports テーブルに保存する。
 * price_reports スキーマ: menu_id, reported_price, reported_hh_price, note, user_fingerprint, status
 * （store_id カラムは存在しないため menu_id のみ保存）
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    store_id?: string;
    menu_id?: string;
    reported_price?: number;
    note?: string;
  };

  const { menu_id, reported_price, note } = body;

  if (!menu_id || reported_price == null) {
    return NextResponse.json(
      { error: "menu_id / reported_price は必須です" },
      { status: 400 }
    );
  }

  // 開発環境: Supabase 未設定ならログのみ
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("[report-price] dev mode:", body);
    return NextResponse.json({ ok: true, mode: "dev" });
  }

  const supabase = createServiceClient();

  // price_reports テーブルの実スキーマに合わせてinsert
  // (store_id カラムなし、created_at は DB デフォルト)
  const { error } = await supabase.from("price_reports").insert({
    menu_id,
    reported_price,
    note: note ?? null,
    status: "pending",          // 管理者承認待ち
  });

  if (error) {
    // テーブル未作成でも UI を壊さない
    console.error("[report-price] insert error:", error.message);
    return NextResponse.json({ ok: true, mode: "noop", detail: error.message });
  }

  return NextResponse.json({ ok: true, mode: "saved" });
}
