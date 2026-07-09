import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import type { Database } from "@/types/database";

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/reports/:reportId
//
// 価格報告を承認または却下する。
// body: { action: "approve" | "reject" }
//
// approve の場合:
//   1. menus テーブルの price / hh_price を更新
//   2. price_reports の status を "approved" に更新
// reject の場合:
//   price_reports の status を "rejected" に更新
// ─────────────────────────────────────────────────────────────

type MenuUpdate = Database["public"]["Tables"]["menus"]["Update"];

interface PatchBody {
  action: "approve" | "reject";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const { reportId } = params;

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action } = body;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "action は approve または reject である必要があります" },
      { status: 400 }
    );
  }

  // ローカル開発フォールバック
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("[PATCH /api/admin/reports] Supabase 未設定 → ローカル開発モード");
    return NextResponse.json({ updated: true, action, _dev: true });
  }

  const supabase = createServiceClient();

  // 1. 対象レポートを取得（pending のもののみ）
  const { data: report, error: fetchError } = await supabase
    .from("price_reports")
    .select("*")
    .eq("report_id", reportId)
    .eq("status", "pending")
    .single();

  if (fetchError || !report) {
    return NextResponse.json({ error: "報告が見つかりません" }, { status: 404 });
  }

  // 2. 承認の場合はメニュー価格を更新
  if (action === "approve") {
    const menuUpdate: MenuUpdate = {
      price: report.reported_price,
      updated_at: new Date().toISOString(),
    };
    if (report.reported_hh_price !== null) {
      menuUpdate.hh_price = report.reported_hh_price;
    }

    const { error: menuError } = await supabase
      .from("menus")
      .update(menuUpdate)
      .eq("menu_id", report.menu_id);

    if (menuError) {
      console.error("[PATCH /api/admin/reports] menu update error", menuError);
      return NextResponse.json(
        { error: "メニュー価格の更新に失敗しました" },
        { status: 500 }
      );
    }
  }

  // 3. 報告のステータスを更新
  const newStatus: "approved" | "rejected" =
    action === "approve" ? "approved" : "rejected";

  const { data: updated, error: updateError } = await supabase
    .from("price_reports")
    .update({ status: newStatus })
    .eq("report_id", reportId)
    .select()
    .single();

  if (updateError) {
    console.error("[PATCH /api/admin/reports] status update error", updateError);
    return NextResponse.json(
      { error: "ステータス更新に失敗しました" },
      { status: 500 }
    );
  }

  console.info(
    `[PATCH /api/admin/reports] reportId=${reportId} action=${action} menuId=${report.menu_id}`
  );

  return NextResponse.json({ report: updated });
}
