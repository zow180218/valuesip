import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import type { Database, MenuCategory } from "@/types/database";

type MenuUpdate = Database["public"]["Tables"]["menus"]["Update"];

// ─────────────────────────────────────────────────────────────
// PATCH /api/owner/menus/:menuId
//
// メニュー情報を更新する（スマレジ商品IDマッピング含む）
// ─────────────────────────────────────────────────────────────

interface PatchMenuBody {
  name?: string;
  price?: number;
  hh_price?: number | null;
  category?: MenuCategory;
  brand_tag?: string | null;
  volume_ml?: number | null;
  smaregi_product_id?: string | null;
  is_active?: boolean;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  const menuId = params.menuId;

  let body: PatchMenuBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ローカル開発フォールバック
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("[PATCH /api/owner/menus] Supabase 未設定 → ローカル開発モード");
    return NextResponse.json({ menu: { menu_id: menuId, ...body }, _dev: true });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // 更新対象フィールドのみ含める
  const updatePayload: MenuUpdate = { updated_at: now };
  if (body.name !== undefined) updatePayload.name = body.name;
  if (body.price !== undefined) updatePayload.price = body.price;
  if (body.hh_price !== undefined) updatePayload.hh_price = body.hh_price;
  if (body.category !== undefined) updatePayload.category = body.category;
  if (body.brand_tag !== undefined) updatePayload.brand_tag = body.brand_tag;
  if (body.volume_ml !== undefined) updatePayload.volume_ml = body.volume_ml;
  if (body.smaregi_product_id !== undefined)
    updatePayload.smaregi_product_id = body.smaregi_product_id;
  if (body.is_active !== undefined) updatePayload.is_active = body.is_active;

  const { data, error } = await supabase
    .from("menus")
    .update(updatePayload)
    .eq("menu_id", menuId)
    .select(
      "menu_id, name, price, hh_price, category, brand_tag, volume_ml, smaregi_product_id, is_active, updated_at"
    )
    .single();

  if (error) {
    console.error("[PATCH /api/owner/menus]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ menu: data });
}
