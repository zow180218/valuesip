"use client";

import { useEffect, useRef } from "react";
import type { StorePinData } from "@/types/store";

interface BottomCardStripProps {
  pinDataList: StorePinData[];
  selectedStoreId: string | null;
  onStoreSelect: (storeId: string) => void;
  hhEnabled: boolean;
}

export default function BottomCardStrip({
  pinDataList,
  selectedStoreId,
  onStoreSelect,
  hhEnabled,
}: BottomCardStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inBudget = pinDataList.filter((d) => d.isInBudget);
  const outOfBudget = pinDataList.filter((d) => !d.isInBudget);

  // 選択中のカードを自動スクロール
  useEffect(() => {
    if (!selectedStoreId || !scrollRef.current) return;
    const card = scrollRef.current.querySelector(
      `[data-store-id="${selectedStoreId}"]`
    ) as HTMLElement | null;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedStoreId]);

  if (pinDataList.length === 0) {
    return (
      <div className="absolute bottom-6 left-4 right-4 z-20">
        <div className="bg-white rounded-2xl shadow-float px-4 py-3 text-center">
          <p className="text-sm text-gray-500">条件に合うお店が見つかりませんでした</p>
          <p className="text-xs text-gray-400 mt-0.5">検索ワードや予算を変えてみてください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-6 left-0 right-0 z-20">
      {/* 件数サマリー */}
      <div className="px-4 mb-2 flex items-center gap-2">
        <span className="bg-white rounded-full px-3 py-1 text-xs font-semibold text-brand-600 shadow-float">
          {inBudget.length}件
          {outOfBudget.length > 0 && (
            <span className="text-gray-400 font-normal ml-1">
              （+{outOfBudget.length}件 予算外）
            </span>
          )}
        </span>
        {hhEnabled && (
          <span className="bg-gray-900 rounded-full px-3 py-1 text-xs font-semibold text-amber-400 shadow-float">
            HH価格表示中
          </span>
        )}
      </div>

      {/* カードスクロール列 */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1 px-4 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {[...inBudget, ...outOfBudget].map((pinData) => {
          const { store, effectivePrice, isHH, isInBudget } = pinData;
          const isSelected = store.store_id === selectedStoreId;

          return (
            <button
              key={store.store_id}
              data-store-id={store.store_id}
              onClick={() => onStoreSelect(store.store_id)}
              className={`flex-shrink-0 snap-start w-48 text-left bg-white rounded-2xl shadow-float p-3 transition-all ${
                isSelected
                  ? "ring-2 ring-brand-500"
                  : "hover:shadow-lg"
              } ${!isInBudget ? "opacity-50" : ""}`}
            >
              {/* 店名 + 公式認証バッジ */}
              <div className="flex items-center gap-1 mb-1">
                <p className="text-sm font-bold text-gray-800 truncate">
                  {store.name}
                </p>
                {store.is_verified && (
                  <span title="公式認証店舗" className="flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l5.59-5.59L18 8l-7 7z"/>
                    </svg>
                  </span>
                )}
              </div>

              {/* 価格 */}
              <div className="flex items-baseline gap-1.5 mb-1">
                <span
                  className={`text-lg font-black ${
                    isHH ? "text-amber-500" : "text-brand-500"
                  }`}
                >
                  ¥{effectivePrice.toLocaleString()}
                </span>
                {isHH && (
                  <span className="text-[10px] font-bold bg-gray-900 text-amber-400 px-1.5 py-0.5 rounded-full">
                    HH
                  </span>
                )}
              </div>

              {/* メタ情報 */}
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="truncate">{store.address.replace("東京都渋谷区", "")}</span>
              </div>

              {store.hh_available && store.hh_time && (
                <div className="mt-1.5 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
                  HH {store.hh_time}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
