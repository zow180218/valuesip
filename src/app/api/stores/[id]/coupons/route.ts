import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/stores/[id]/coupons — 有効クーポン一覧 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const storeId = params.id;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ coupons: [] });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await (supabase.from("store_coupons") as any)
    .select("id, store_id, title, description, discount_text, valid_from, valid_until, is_active, created_at")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .or(`valid_until.is.null,valid_until.gt.${now}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[/api/stores/[id]/coupons GET]", error.message);
    return NextResponse.json({ coupons: [] });
  }

  return NextResponse.json({ coupons: data ?? [] });
}
