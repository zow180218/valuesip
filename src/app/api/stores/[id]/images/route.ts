import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/stores/[id]/images — 承認済み画像一覧 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const storeId = params.id;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ images: [] });
  }

  const supabase = createServiceClient();
  const { data, error } = await (supabase.from("store_images") as any)
    .select("id, image_url, uploaded_by, created_at")
    .eq("store_id", storeId)
    .eq("is_approved", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[/api/stores/[id]/images GET]", error.message);
    return NextResponse.json({ images: [] });
  }

  return NextResponse.json({ images: data ?? [] });
}

/** POST /api/stores/[id]/images — ユーザーが画像URLを投稿（要承認） */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const storeId = params.id;
  const body = (await req.json()) as { image_url?: string; uploaded_by?: string };
  const { image_url, uploaded_by = "user" } = body;

  if (!image_url) {
    return NextResponse.json({ error: "image_url は必須です" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("[images POST] dev mode:", { storeId, image_url });
    return NextResponse.json({ ok: true, mode: "dev" });
  }

  const supabase = createServiceClient();
  const isOwner = uploaded_by === "owner";

  const { error } = await (supabase.from("store_images") as any).insert({
    store_id: storeId,
    image_url,
    uploaded_by,
    is_approved: isOwner, // オーナー投稿は即承認
  });

  if (error) {
    console.error("[images POST]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pending: !isOwner });
}
