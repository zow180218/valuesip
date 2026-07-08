import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createServiceClient } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────
// スマレジ Webhook ペイロード型
// 参考: https://www.smaregi.dev/apidoc/
// ─────────────────────────────────────────────────────────────

/** トランザクション明細（1商品分） */
interface SmaregiTransactionDetail {
  transactionDetailId: string;
  productId: string;          // スマレジ商品ID
  productCode?: string;       // JANコード等
  productName: string;        // 商品名
  price: number;              // 単価（販売価格）
  quantity: number;
  salesPrice?: number;        // 割引後販売価格（HH時に変化）
  taxDivision?: string;       // 税区分
  categoryId?: string;
}

/** スマレジ Webhook ペイロード（transaction イベント） */
interface SmaregiTransactionPayload {
  contractId: string;         // スマレジ契約ID
  storeId: string;            // スマレジ店舗ID（stores.smaregi_id と照合）
  terminalId?: string;
  transactionHeadId?: string;
  transactionDateTime?: string; // ISO8601 例: "2026-07-08T19:32:00+09:00"
  details: SmaregiTransactionDetail[];
}

// ─────────────────────────────────────────────────────────────
// HMAC-SHA256 署名検証
//
// スマレジは Webhook リクエストの `X-Smareq-Signatures` ヘッダーに
// "sha256=<hex>" 形式で署名を付与する。
// シークレットは Smaregi 開発者ポータル → Webhooks → 署名シークレットで取得。
// ─────────────────────────────────────────────────────────────
function verifySmaregiSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  // "sha256=<hex>" のプレフィックスを除去
  const hexSignature = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice(7)
    : signatureHeader;

  const hmac = createHmac("sha256", secret);
  hmac.update(rawBody, "utf8");
  const computed = hmac.digest("hex");

  // タイミング攻撃対策
  try {
    return timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(hexSignature, "hex")
    );
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/webhooks/smaregi
//
// スマレジ POS トランザクション Webhook を受信し、
// 対応メニューの価格を Supabase に書き込む。
//
// 処理フロー:
//   1. HMAC-SHA256 署名検証
//   2. storeId → stores.smaregi_id でバリューシップ店舗を特定
//   3. details[] の各商品を menus.smaregi_product_id または名称でマッチング
//   4. price / hh_price を更新（HH判定あり）
//   5. stores.updated_at を更新（データ鮮度表示用）
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // ── 署名シークレット確認 ──────────────────────
  const secret = process.env.SMAREGI_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Smaregi Webhook] SMAREGI_WEBHOOK_SECRET が未設定");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // ── リクエストボディを生テキストで取得 ─────────
  const rawBody = await request.text();

  // ── 署名検証 ──────────────────────────────────
  const signatureHeader =
    request.headers.get("x-smareq-signatures") ??
    request.headers.get("x-smaregi-signature") ?? // 旧形式フォールバック
    "";

  if (!signatureHeader) {
    return NextResponse.json({ error: "Missing signature header" }, { status: 401 });
  }

  if (!verifySmaregiSignature(rawBody, signatureHeader, secret)) {
    console.warn("[Smaregi Webhook] 署名検証失敗");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── JSON パース ───────────────────────────────
  let payload: SmaregiTransactionPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { storeId: smaregiStoreId, details, transactionDateTime } = payload;

  if (!smaregiStoreId || !Array.isArray(details) || details.length === 0) {
    return NextResponse.json({ status: "ignored", reason: "empty payload" });
  }

  // ── Supabase 未設定チェック ───────────────────
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("[Smaregi Webhook] Supabase 未設定 → スキップ");
    return NextResponse.json({ status: "dev_mode_skip" });
  }

  const supabase = createServiceClient();

  // ── スマレジ店舗ID → バリューシップ店舗 ─────────
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("store_id, smaregi_id")
    .eq("smaregi_id", smaregiStoreId)
    .single();

  if (storeError || !store) {
    console.warn("[Smaregi Webhook] 未登録のスマレジ店舗:", smaregiStoreId);
    return NextResponse.json({ status: "store_not_found" });
  }

  // ── HH 中かどうかを判定 ──────────────────────
  //   トランザクション時刻と hh_hours を照合。
  //   HH 中であれば hh_price を更新、通常時は price を更新する。
  const { data: storeDetail } = await supabase
    .from("stores")
    .select("hh_hours")
    .eq("store_id", store.store_id)
    .single();

  const isInHH = detectHH(transactionDateTime, storeDetail?.hh_hours ?? null);

  // ── メニュー価格の一括更新 ──────────────────
  const now = new Date().toISOString();
  const results: Array<{ productId: string; status: string }> = [];

  for (const item of details) {
    const effectivePrice = item.salesPrice ?? item.price;

    // smaregi_product_id で一致するメニューを検索
    let menuQuery = supabase
      .from("menus")
      .select("menu_id, price, hh_price")
      .eq("store_id", store.store_id)
      .eq("is_active", true);

    if (item.productId) {
      menuQuery = menuQuery.eq("smaregi_product_id", item.productId);
    } else {
      // フォールバック: 商品名で検索
      menuQuery = menuQuery.eq("name", item.productName);
    }

    const { data: menus } = await menuQuery;

    if (!menus || menus.length === 0) {
      results.push({ productId: item.productId, status: "not_found" });
      continue;
    }

    for (const menu of menus) {
      const updatePayload = isInHH
        ? { hh_price: effectivePrice, updated_at: now }  // HH中 → hh_price を更新
        : { price: effectivePrice, updated_at: now };     // 通常時 → price を更新

      const { error: updateError } = await supabase
        .from("menus")
        .update(updatePayload)
        .eq("menu_id", menu.menu_id);

      if (updateError) {
        console.error("[Smaregi Webhook] メニュー更新エラー:", updateError, "menu_id:", menu.menu_id);
        results.push({ productId: item.productId, status: "update_error" });
      } else {
        results.push({ productId: item.productId, status: isInHH ? "hh_price_updated" : "price_updated" });
      }
    }
  }

  // ── 店舗の updated_at を更新（データ鮮度表示）──
  await supabase
    .from("stores")
    .update({ updated_at: now })
    .eq("store_id", store.store_id);

  console.info("[Smaregi Webhook] 処理完了 store_id:", store.store_id, "items:", results.length);
  return NextResponse.json({ status: "ok", results });
}

// ─────────────────────────────────────────────────────────────
// HH 時間帯かどうかを判定するユーティリティ
//
// @param transactionDateTime  ISO8601 (例: "2026-07-08T18:30:00+09:00")
// @param hhHours              "17:00〜19:00" 形式の文字列 or null
// ─────────────────────────────────────────────────────────────
function detectHH(
  transactionDateTime: string | undefined,
  hhHours: string | null
): boolean {
  if (!transactionDateTime || !hhHours) return false;

  // "17:00〜19:00" または "17:00-19:00" をパース
  const match = hhHours.match(/(\d{1,2}):(\d{2})[〜~-](\d{1,2}):(\d{2})/);
  if (!match) return false;

  const [, startH, startM, endH, endM] = match.map(Number);
  const txDate = new Date(transactionDateTime);
  const txMinutes = txDate.getHours() * 60 + txDate.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return txMinutes >= startMinutes && txMinutes < endMinutes;
}
