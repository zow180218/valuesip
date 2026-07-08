import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// ─────────────────────────────────────────
// リクエストボディの型
// ─────────────────────────────────────────
interface PatchStoreBody {
  name: string;
  address: string;
  phone?: string;
  seats?: string | number;
  hh_available: boolean;
  hh_time?: string;
  open_hours?: string;
  closed_days?: string;
}

/**
 * PATCH /api/owner/stores/:id
 *
 * オーナーポータルから店舗情報を更新する。
 * Supabase 未設定（ローカル開発）時はサンプルデータを返す（DB書き込みなし）。
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const storeId = params.id;

  // ── Body パース ──────────────────────────
  let body: PatchStoreBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, address, phone, seats, hh_available, hh_time, open_hours, closed_days } = body;

  if (!name?.trim() || !address?.trim()) {
    return NextResponse.json(
      { error: "name と address は必須項目です" },
      { status: 400 }
    );
  }

  // ── Supabase 未設定時（ローカル開発フォールバック）──
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("[PATCH /api/owner/stores] Supabase 未設定 → ローカル開発モード（保存スキップ）");
    return NextResponse.json({
      store: { store_id: storeId, name, address },
      _dev: true,
    });
  }

  // ── Supabase 書き込み ─────────────────────
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("stores")
    .update({
      name: name.trim(),
      address: address.trim(),
      phone: phone?.trim() || null,
      seats: seats !== undefined && seats !== "" ? Number(seats) : null,
      hh_hours: hh_available ? (hh_time?.trim() || null) : null,
      open_hours: open_hours?.trim() || null,
      closed_days: closed_days?.trim() || null,
      updated_at: now,
    })
    .eq("store_id", storeId)
    .select("store_id, name, address, phone, seats, hh_hours, open_hours, closed_days, updated_at")
    .single();

  if (error) {
    console.error("[PATCH /api/owner/stores]", error);
    // store_id が見つからない場合
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ store: data });
}
