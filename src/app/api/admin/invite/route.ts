import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
// POST /api/admin/invite
//
// 店舗オーナー招待メールを送信する。
// Supabase Auth の inviteUserByEmail を使用。
// 招待されたユーザーはメール内リンクをクリック後
// /owner/register?store_id=<id> でオンボーディングを完了する。
// ─────────────────────────────────────────────────────────────

interface InviteBody {
  email: string;
  store_id: string;
  role?: string;
}

export async function POST(request: NextRequest) {
  let body: InviteBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, store_id, role = "owner" } = body;

  if (!email?.trim() || !store_id?.trim()) {
    return NextResponse.json(
      { error: "email と store_id は必須です" },
      { status: 400 }
    );
  }

  // メール形式チェック
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "メールアドレスが正しくありません" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("[POST /api/admin/invite] Supabase 未設定 → ローカル開発モード");
    return NextResponse.json({ invited: true, _dev: true });
  }

  const supabase = createServiceClient();

  // 店舗が存在するか確認
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("store_id, name")
    .eq("store_id", store_id)
    .single();

  if (storeError || !store) {
    return NextResponse.json({ error: "指定された店舗が見つかりません" }, { status: 404 });
  }

  // 招待メールの送信
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://valuesip.vercel.app";

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/owner/register?store_id=${store_id}`,
    data: {
      store_id,
      store_name: store.name,
      role,
    },
  });

  if (error) {
    console.error("[POST /api/admin/invite]", error);
    // 既に招待済みの場合
    if (error.message.includes("already been registered")) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "招待メールの送信に失敗しました" }, { status: 500 });
  }

  console.info(
    `[POST /api/admin/invite] 招待送信完了 email=${email} store_id=${store_id}`
  );

  return NextResponse.json({
    invited: true,
    user_id: data.user?.id,
    store_name: store.name,
  });
}
