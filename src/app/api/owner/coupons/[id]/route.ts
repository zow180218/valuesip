import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** PATCH /api/owner/coupons/[id] — クーポン更新 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const couponId = params.id;
  const body = (await req.json()) as Record<string, unknown>;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true, mode: "dev" });
  }

  const supabase = createServiceClient();
  const { data, error } = await (supabase.from("store_coupons") as any)
    .update(body)
    .eq("id", couponId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data });
}

/** DELETE /api/owner/coupons/[id] — クーポン削除 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const couponId = params.id;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true, mode: "dev" });
  }

  const supabase = createServiceClient();
  const { error } = await (supabase.from("store_coupons") as any)
    .delete()
    .eq("id", couponId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
