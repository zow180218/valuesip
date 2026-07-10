import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import type { Store, Menu, AreaId } from "@/types/store";
import { SAMPLE_STORES } from "@/data/stores";

// Supabase DB のカラム型（スキーマと一致させる）
type StoreRow = {
  store_id: string;
  area_id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  google_place_id: string | null;
  opening_hours: Record<string, string> | null;
  hh_hours: string | null;
  phone: string | null;
  website_url: string | null;
  is_active: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
};

type MenuRow = {
  menu_id: string;
  store_id: string;
  name: string;
  category: string;
  brand_tag: string | null;
  price: number;
  hh_price: number | null;
  volume_ml: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * GET /api/stores?area=shibuya
 *
 * 指定エリアの店舗一覧（メニュー込み）を返す。
 * Supabase未設定時はフォールバックとしてローカルサンプルデータを返す。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const areaId = searchParams.get("area") ?? "shibuya";

  // Supabase 環境変数が未設定の場合はサンプルデータを返す
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const filtered = SAMPLE_STORES.filter((s) => s.area === areaId);
    return NextResponse.json({ stores: filtered });
  }

  const supabase = createServiceClient();

  // 店舗取得（verified を明示的に SELECT してスキーマキャッシュ問題を回避）
  const { data: rawStoreRows, error: storesError } = await supabase
    .from("stores")
    .select(
      "store_id, area_id, name, address, lat, lng, google_place_id, opening_hours, hh_hours, phone, website_url, is_active, verified, created_at, updated_at"
    )
    .eq("area_id", areaId)
    .eq("is_active", true)
    .order("store_id");

  if (storesError) {
    console.error("[/api/stores] stores fetch error:", storesError);
    return NextResponse.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }

  const storeRows = (rawStoreRows ?? []) as unknown as StoreRow[];

  if (storeRows.length === 0) {
    return NextResponse.json({ stores: [] });
  }

  const storeIds = storeRows.map((s) => s.store_id);

  // メニュー取得
  const { data: rawMenuRows, error: menusError } = await supabase
    .from("menus")
    .select("*")
    .in("store_id", storeIds)
    .eq("is_active", true);

  if (menusError) {
    console.error("[/api/stores] menus fetch error:", menusError);
    return NextResponse.json(
      { error: "Failed to fetch menus" },
      { status: 500 }
    );
  }

  const menuRows = (rawMenuRows ?? []) as unknown as MenuRow[];

  // 店舗ごとにメニューをグループ化
  const menusByStore = menuRows.reduce<Record<string, Menu[]>>((acc, row) => {
    if (!acc[row.store_id]) acc[row.store_id] = [];
    acc[row.store_id].push({
      id: row.menu_id,           // DB: menu_id → 型: id
      name: row.name,
      category: row.category as Menu["category"],
      brand_tag: row.brand_tag ?? undefined,
      price: row.price,
      hh_price: row.hh_price ?? undefined,
      volume_ml: row.volume_ml ?? undefined,
      smaregi_product_id: (row as typeof row & { smaregi_product_id?: string | null }).smaregi_product_id ?? undefined,
    });
    return acc;
  }, {});

  // DB スキーマ → Store 型にマッピング
  const stores: Store[] = storeRows.map((row) => ({
    store_id: row.store_id,
    name: row.name,
    area: row.area_id as AreaId,       // DB: area_id → 型: area
    address: row.address ?? "",
    lat: row.lat,
    lng: row.lng,
    hh_available: row.hh_hours !== null,  // DB: hh_hours → 型: hh_available
    hh_time: row.hh_hours ?? undefined,   // DB: hh_hours → 型: hh_time
    data_updated_at: row.updated_at,
    phone: row.phone ?? undefined,
    is_verified: row.verified,            // ⑦ 公式認証バッジ
    menus: menusByStore[row.store_id] ?? [],
  }));

  return NextResponse.json({ stores });
}
