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
  is_verified?: boolean;
}

/**
 * JWT トークンからユーザーを取得し、該当店舗のオーナー権限を確認する。
 * 開発環境（Supabase 未設定）では認証をスキップ。
 */
async function verifyOwner(
  request: NextRequest,
  storeId: string
): Promise<{ userId: string } | null> {
  // Supabase 未設定時はスキップ
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { userId: "dev" };

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return null;

  const supabase = createServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // owner_store_map で所有権を確認
  const { data: mapping } = await supabase
    .from("owner_store_map")
    .select("store_id")
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!mapping) return null;

  return { userId: user.id };
}

/**
 * PATCH /api/owner/stores/:id
 *
 * オーナーポータルから店舗情報を更新する。
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

  const { name, address, phone, seats, hh_available, hh_time, open_hours, closed_days, is_verified } = body;

  if (!name?.trim() || !address?.trim()) {
    return NextResponse.json(
      { error: "name と address は必須項目です" },
      { status: 400 }
    );
  }

  // ── 認証チェック ─────────────────────────
  const owner = await verifyOwner(request, storeId);

  // ── Supabase 未設定時（ローカル開発フォールバック）──
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("[PATCH /api/owner/stores] Supabase 未設定 → ローカル開発モード（保存スキップ）");
    return NextResponse.json({
      store: { store_id: storeId, name, address },
      _dev: true,
    });
  }

  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Supabase 書き込み ─────────────────────
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    name: name.trim(),
    address: address.trim(),
    phone: phone?.trim() || null,
    seats: seats !== undefined && seats !== "" ? Number(seats) : null,
    hh_hours: hh_available ? (hh_time?.trim() || null) : null,
    open_hours: open_hours?.trim() || null,
    closed_days: closed_days?.trim() || null,
    updated_at: now,
  };

  // ⑦ 公式認証フラグ（明示的に渡された場合のみ更新）
  if (is_verified !== undefined) {
    updatePayload.verified = is_verified;
    updatePayload.verified_at = is_verified ? now : null;
  }

  const { data, error } = await supabase
    .from("stores")
    .update(updatePayload)
    .eq("store_id", storeId)
    .select("store_id, name, address, phone, seats, hh_hours, open_hours, closed_days, verified, verified_at, updated_at")
    .single();

  if (error) {
    console.error("[PATCH /api/owner/stores]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ store: data });
}
