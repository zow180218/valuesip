import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// POST /api/analytics/event
//
// ユーザー行動イベントを page_views テーブルに記録する。
// fire-and-forget 用。常に 200 を返す（エラー時も静かに失敗）。
// ─────────────────────────────────────────────────────────────

const VALID_EVENTS = ["store_view", "menu_view", "map_click", "phone_tap"] as const;
type EventType = (typeof VALID_EVENTS)[number];

export async function POST(req: NextRequest) {
  // 環境変数チェック（ローカル未設定時はスキップ）
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json({ ok: true, _dev: true });
  }

  try {
    const body = await req.json();
    const { store_id, event_type, user_fingerprint } = body as {
      store_id?: string;
      event_type?: string;
      user_fingerprint?: string;
    };

    // バリデーション
    if (!store_id || typeof store_id !== "string") {
      return NextResponse.json({ ok: false, error: "store_id required" }, { status: 400 });
    }
    if (!event_type || !VALID_EVENTS.includes(event_type as EventType)) {
      return NextResponse.json({ ok: false, error: "invalid event_type" }, { status: 400 });
    }

    // サービスロールで INSERT（RLS バイパス）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase.from("page_views").insert({
      store_id,
      event_type,
      user_fingerprint: user_fingerprint ?? null,
    });

    if (error) {
      // ログには出すが 200 を返してフロントに影響させない
      console.error("[analytics/event] insert error", error.message);
    }
  } catch (e) {
    console.error("[analytics/event] unexpected error", e);
  }

  // 常に 200
  return NextResponse.json({ ok: true });
}
