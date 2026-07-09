"use client";

import Link from "next/link";
import type { Store } from "@/types/store";
import { effectiveMenuPrice } from "@/lib/filters";

interface StoreDetailSheetProps {
  store: Store;
  hhEnabled: boolean;
  onClose: () => void;
}

export default function StoreDetailSheet({
  store,
  hhEnabled,
  onClose,
}: StoreDetailSheetProps) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    store.name + " " + store.address
  )}`;

  // メニューをカテゴリ順にソート
  const categoryOrder = ["beer", "highball", "shochu", "wine", "cocktail", "other", "soft"];
  const sortedMenus = [...store.menus].sort(
    (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
  );

  const categoryLabel: Record<string, string> = {
    beer: "ビール",
    highball: "ハイボール",
    shochu: "サワー・焼酎",
    wine: "ワイン",
    cocktail: "カクテル",
    soft: "ソフトドリンク",
    other: "その他",
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 animate-slide-up">
      <div className="bg-white rounded-t-3xl shadow-float max-h-[70vh] flex flex-col">
        {/* ハンドル */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* ヘッダー */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">
              {store.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {store.hh_available && store.hh_time && (
                <span className="text-[11px] bg-gray-900 text-amber-400 font-semibold px-2 py-0.5 rounded-full">
                  HH {store.hh_time}
                </span>
              )}
              <span className="text-[11px] text-gray-400">
                更新: {store.data_updated_at}
              </span>
              {store.seats && (
                <span className="text-[11px] text-gray-400">約{store.seats}席</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 flex-shrink-0"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* メニューリスト */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-5 py-3"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {sortedMenus.map((menu) => {
            const currentPrice = effectiveMenuPrice(menu, hhEnabled);
            const isHHApplied = hhEnabled && menu.hh_price !== undefined && menu.hh_price === currentPrice;

            return (
              <div
                key={menu.id}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm text-gray-800 truncate">{menu.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {categoryLabel[menu.category] ?? menu.category}
                    </span>
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
                    <div>
                      <span className="text-base font-bold text-amber-500">
                        ¥{currentPrice.toLocaleString()}
                      </span>
                      <span className="ml-1 text-[10px] font-bold bg-gray-900 text-amber-400 px-1.5 py-0.5 rounded-full">
                        HH
                      </span>
                      <div className="text-[10px] text-gray-400 line-through">
                        ¥{menu.price.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-base font-bold text-gray-800">
                        ¥{currentPrice.toLocaleString()}
                      </span>
                      {menu.hh_price && !hhEnabled && (
                        <div className="text-[10px] text-amber-500">
                          HH ¥{menu.hh_price.toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* フッター（住所 + ボタン群） */}
        <div className="px-5 py-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-2.5 min-w-0">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <p className="text-xs text-gray-500 truncate">{store.address}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/stores/${store.store_id}`}
              className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 text-xs font-semibold px-3 py-2 rounded-full hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              店舗情報
            </Link>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-full hover:bg-brand-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              地図で開く
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
