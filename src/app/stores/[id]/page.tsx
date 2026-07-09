"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Store, Menu } from "@/types/store";
import { SAMPLE_STORES } from "@/data/stores";
import { effectiveMenuPrice } from "@/lib/filters";
import PriceVoting from "@/components/PriceVoting";

type Tab = "info" | "menu";

const categoryOrder = ["beer", "highball", "shochu", "wine", "cocktail", "other", "soft"];

const categoryLabel: Record<string, string> = {
  beer: "ビール",
  highball: "ハイボール",
  shochu: "サワー・焼酎",
  wine: "ワイン",
  cocktail: "カクテル",
  soft: "ソフトドリンク",
  other: "その他",
};

const areaLabel: Record<string, string> = {
  shibuya: "渋谷",
  shinjuku: "新宿",
  harajuku: "原宿",
  ebisu: "恵比寿",
  daikanyama: "代官山",
};

// カテゴリ別にメニューをグループ化
function groupMenusByCategory(menus: Menu[]): { category: string; items: Menu[] }[] {
  const sorted = [...menus].sort(
    (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
  );
  const groups: { category: string; items: Menu[] }[] = [];
  for (const menu of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.category === menu.category) {
      last.items.push(menu);
    } else {
      groups.push({ category: menu.category, items: [menu] });
    }
  }
  return groups;
}

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params?.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [hhEnabled, setHhEnabled] = useState(true);

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stores?area=shibuya`);
        if (res.ok) {
          const data: { stores: Store[] } = await res.json();
          const found = data.stores.find((s) => s.store_id === storeId);
          if (found) {
            setStore(found);
            setLoading(false);
            return;
          }
        }
      } catch {
        // fall through to sample data
      }
      const found = SAMPLE_STORES.find((s) => s.store_id === storeId) ?? null;
      setStore(found);
      setLoading(false);
    };

    if (storeId) fetchStore();
  }, [storeId]);

  const mapsUrl = store
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        store.name + " " + store.address
      )}`
    : "#";

  const mapsRouteUrl = store
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}`
    : "#";

  // 最安・最高価格
  const priceRange = store?.menus.length
    ? (() => {
        const prices = store.menus.map((m) => effectiveMenuPrice(m, hhEnabled));
        return { min: Math.min(...prices), max: Math.max(...prices) };
      })()
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">読み込み中…</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-5xl mb-4">🍺</div>
          <p className="text-base font-semibold text-gray-700 mb-2">店舗が見つかりませんでした</p>
          <p className="text-sm text-gray-400 mb-6">指定されたIDの店舗は存在しないか、削除された可能性があります。</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full"
          >
            地図に戻る
          </Link>
        </div>
      </div>
    );
  }

  const menuGroups = groupMenusByCategory(store.menus);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── ナビゲーションバー ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-800 truncate flex-1">{store.name}</span>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Googleマップで開く"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </header>

      {/* ── ヒーローセクション ── */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{store.name}</h1>
            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              {store.area && (
                <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                  {areaLabel[store.area] ?? store.area}
                </span>
              )}
              {store.hh_available && store.hh_time && (
                <span className="text-[11px] bg-gray-900 text-amber-400 font-bold px-2.5 py-0.5 rounded-full">
                  HH {store.hh_time}
                </span>
              )}
              {priceRange && (
                <span className="text-[11px] text-brand-600 bg-brand-50 font-semibold px-2 py-0.5 rounded-full">
                  ¥{priceRange.min.toLocaleString()}〜¥{priceRange.max.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* HHバナー */}
        {store.hh_available && (
          <div className="mt-3 flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <span className="text-lg">🍻</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-800">
                ハッピーアワー {store.hh_time ?? ""} 実施中
              </p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                対象ドリンクが特別価格でご利用いただけます
              </p>
            </div>
            <button
              onClick={() => setHhEnabled((v) => !v)}
              className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                hhEnabled
                  ? "bg-amber-400 text-white"
                  : "bg-amber-100 text-amber-600 border border-amber-300"
              }`}
            >
              {hhEnabled ? "HH ON" : "HH OFF"}
            </button>
          </div>
        )}
      </div>

      {/* ── タブバー ── */}
      <div className="sticky top-14 z-10 bg-white border-b border-gray-100">
        <div className="flex">
          {(["info", "menu"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab
                  ? "text-brand-600 border-brand-500"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {tab === "info" ? "基本情報" : "メニュー"}
            </button>
          ))}
        </div>
      </div>

      {/* ── タブコンテンツ ── */}
      <div className="flex-1 pb-28">

        {/* ── 基本情報タブ ── */}
        {activeTab === "info" && (
          <div className="px-4 py-4 space-y-3">
            {/* 住所 */}
            <div className="bg-white rounded-2xl px-4 py-4 space-y-3.5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">店舗情報</h2>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">住所</p>
                  <p className="text-sm text-gray-800">{store.address}</p>
                </div>
              </div>

              {store.seats && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">席数</p>
                    <p className="text-sm text-gray-800">約 {store.seats} 席</p>
                  </div>
                </div>
              )}

              {store.open_hours && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">営業時間</p>
                    <p className="text-sm text-gray-800">{store.open_hours}</p>
                    {store.closed_days && (
                      <p className="text-xs text-gray-500 mt-0.5">定休日: {store.closed_days}</p>
                    )}
                  </div>
                </div>
              )}

              {store.phone && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">電話番号</p>
                    <a href={`tel:${store.phone}`} className="text-sm text-brand-600 font-medium">
                      {store.phone}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">データ更新日</p>
                  <p className="text-sm text-gray-800">{store.data_updated_at}</p>
                </div>
              </div>
            </div>

            {/* HH詳細 */}
            {store.hh_available && store.hh_time && (
              <div className="bg-white rounded-2xl px-4 py-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3.5">ハッピーアワー</h2>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🍻</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">HH時間帯</p>
                    <p className="text-sm text-gray-800 font-semibold">{store.hh_time}</p>
                  </div>
                </div>
              </div>
            )}

            {/* メニューへの誘導 */}
            <button
              onClick={() => setActiveTab("menu")}
              className="w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🍺</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-800">
                  ドリンクメニューを見る
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{store.menus.length} 件掲載中</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* ── メニュータブ ── */}
        {activeTab === "menu" && (
          <div className="px-4 py-4">
            {/* HH切り替えバー */}
            {store.hh_available && (
              <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">ハッピーアワー価格</p>
                  <p className="text-xs text-gray-400 mt-0.5">{store.hh_time}</p>
                </div>
                <button
                  onClick={() => setHhEnabled((v) => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    hhEnabled ? "bg-brand-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      hhEnabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            )}

            {/* メニューカード（カテゴリ別） */}
            <div className="space-y-3">
              {menuGroups.map(({ category, items }) => (
                <div key={category} className="bg-white rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {categoryLabel[category] ?? category}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map((menu) => {
                      const currentPrice = effectiveMenuPrice(menu, hhEnabled);
                      const isHHApplied =
                        hhEnabled &&
                        menu.hh_price !== undefined &&
                        menu.hh_price === currentPrice;

                      return (
                        <div key={menu.id} className="flex items-center px-4 py-3.5 gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 font-medium">{menu.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {menu.brand_tag && (
                                <span className="text-[10px] text-gray-400">{menu.brand_tag}</span>
                              )}
                              {menu.volume_ml && (
                                <span className="text-[10px] text-gray-400">{menu.volume_ml}ml</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {isHHApplied ? (
                              <>
                                <div className="flex items-center gap-1 justify-end">
                                  <span className="text-base font-bold text-amber-500">
                                    ¥{currentPrice.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] font-bold bg-gray-900 text-amber-400 px-1.5 py-0.5 rounded-full">
                                    HH
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-400 line-through text-right">
                                  ¥{menu.price.toLocaleString()}
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-base font-bold text-gray-800">
                                  ¥{currentPrice.toLocaleString()}
                                </span>
                                {menu.hh_price && !hhEnabled && (
                                  <div className="text-[11px] text-amber-500 text-right">
                                    HH ¥{menu.hh_price.toLocaleString()}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {/* 価格投票・報告 */}
                        <PriceVoting menuId={menu.id} menuName={menu.name} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 固定フッター アクションボタン ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 px-4 py-3 pb-safe">
        <div className="flex gap-3">
          {store.phone && (
            <a
              href={`tel:${store.phone}`}
              className="flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              電話
            </a>
          )}
          <a
            href={mapsRouteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-brand-500 text-white text-sm font-bold py-3 rounded-2xl hover:bg-brand-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Googleマップで経路を確認
          </a>
        </div>
      </div>
    </div>
  );
}
