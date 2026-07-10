import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// ─────────────────────────────────────────
// CSV インポート行の型
// ─────────────────────────────────────────
interface ImportMenuRow {
  name: string;
  category: string;
  price: string | number;
  hh_price?: string | number | null;
  volume_ml?: string | number | null;
  brand_tag?: string | null;
}

const VALID_CATEGORIES = ["beer", "highball", "shochu", "wine", "cocktail", "soft", "other"] as const;
type MenuCategory = typeof VALID_CATEGORIES[number];

/**
 * JWT トークンからオーナー権限を確認する。開発環境ではスキップ。
 */
async function verifyOwner(
  request: NextRequest,
  storeId: string
): Promise<{ userId: string } | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { userId: "dev" };

  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;

  const supabase = createServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

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
 * POST /api/owner/stores/:id/menus/import
 *
 * クライアントサイドでパース済みの CSV 行を受け取り、
 * 既存メニューを置き換える（全削除→一括 INSERT）。
 *
 * Body: { rows: ImportMenuRow[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const storeId = params.id;

  // ── Body パース ──────────────────────────
  let rows: ImportMenuRow[];
  try {
    const body = await request.json();
    rows = body.rows;
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("empty");
  } catch {
    return NextResponse.json({ error: "rows が必要です" }, { status: 400 });
  }

  // ── 行バリデーション ──────────────────────
  const errors: string[] = [];
  const validated: Array<{
    store_id: string;
    name: string;
    category: MenuCategory;
    price: number;
    hh_price: number | null;
    volume_ml: number | null;
    brand_tag: string | null;
    is_active: boolean;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // ヘッダー行を 1 とする

    if (!row.name?.toString().trim()) {
      errors.push(`行${lineNum}: name が空です`);
      continue;
    }

    const category = row.category?.toString().trim() as MenuCategory;
    if (!VALID_CATEGORIES.includes(category)) {
      errors.push(`行${lineNum}: category "${row.category}" が不正です（${VALID_CATEGORIES.join("/")}）`);
      continue;
    }

    const price = Number(row.price);
    if (isNaN(price) || price < 0) {
      errors.push(`行${lineNum}: price "${row.price}" が不正です`);
      continue;
    }

    const hh_price = row.hh_price !== undefined && row.hh_price !== null && row.hh_price !== ""
      ? Number(row.hh_price)
      : null;
    if (hh_price !== null && isNaN(hh_price)) {
      errors.push(`行${lineNum}: hh_price "${row.hh_price}" が不正です`);
      continue;
    }

    const volume_ml = row.volume_ml !== undefined && row.volume_ml !== null && row.volume_ml !== ""
      ? Number(row.volume_ml)
      : null;

    validated.push({
      store_id: storeId,
      name: row.name.toString().trim(),
      category,
      price,
      hh_price,
      volume_ml,
      brand_tag: row.brand_tag?.toString().trim() || null,
      is_active: true,
    });
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "バリデーションエラー", details: errors }, { status: 422 });
  }

  // ── Supabase 未設定時（ローカル開発フォールバック）──
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("[POST /api/owner/stores/menus/import] Supabase 未設定 → 開発モード");
    return NextResponse.json({ imported: validated.length, _dev: true });
  }

  // ── 認証チェック ─────────────────────────
  const owner = await verifyOwner(request, storeId);
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // ── 既存メニューを論理削除 → 新規 INSERT ─
  const { error: deactivateError } = await supabase
    .from("menus")
    .update({ is_active: false })
    .eq("store_id", storeId);

  if (deactivateError) {
    console.error("[menus/import] deactivate error:", deactivateError);
    return NextResponse.json({ error: "既存メニューの削除に失敗しました" }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("menus")
    .insert(validated as any)
    .select("menu_id");

  if (insertError) {
    console.error("[menus/import] insert error:", insertError);
    return NextResponse.json({ error: "メニューの保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ imported: inserted?.length ?? 0 });
}
