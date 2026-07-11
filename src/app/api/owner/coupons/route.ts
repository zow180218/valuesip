import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getAuthHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/owner/coupons?store_id=xxx — オーナー用クーポン一覧（全件） */
export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("store_id");
  if (!storeId) return NextResponse.json({ error: "store_id required" }, { status: 400 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ coupons: [] });
  }

  const supabase = createServiceClient();
  const { data, error } = await (supabase.from("store_coupons") as any)
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: data ?? [] });
}

/** POST /api/owner/coupons — クーポン新規作成 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    store_id?: string;
    title?: string;
    description?: string;
    discount_text?: string;
    valid_until?: string | null;
  };

  const { store_id, title, discount_text, description, valid_until } = body;
  if (!store_id || !title || !discount_text) {
    return NextResponse.json(
      { error: "store_id / title / discount_text は必須です" },
      { status: 400 }
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("[coupons POST] dev mode:", body);
    return NextResponse.json({ ok: true, mode: "dev" });
  }

  const supabase = createServiceClient();
  const { data, error } = await (supabase.from("store_coupons") as any)
    .insert({
      store_id,
      title,
      description: description ?? null,
      discount_text,
      valid_until: valid_until ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data });
}
