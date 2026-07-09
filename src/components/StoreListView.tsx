"use client";

import type { StorePinData } from "@/types/store";

interface StoreListViewProps {
  pinDataList: StorePinData[];
  selectedStoreId: string | null;
  onStoreSelect: (storeId: string) => void;
  hhEnabled: boolean;
}

const areaLabel: Record<string, string> = {
  shibuya: "渋谷",
  shinjuku: "新宿",
  harajuku: "原宿",
  ebisu: "恵比寿",
  daikanyama: "代官山",
};

export default function StoreListView({
  pinDataList,
  selectedStoreId,
  onStoreSelect,
  hhEnabled,
}: StoreListViewProps) {
  // 予算内優先 → HHあり優先 → 最安値順
  const sorted = [...pinDataList].sort((a, b) => {
    if (a.isInBudget !== b.isInBudget) return a.isInBudget ? -1 : 1;
    if (a.isHH !== b.isHH) return a.isHH ? -1 : 1;
    return a.effectivePrice - b.effectivePrice;
  });

  const inBudgetCount = pinDataList.filter((d) => d.isInBudget).length;
  const outCount = pinDataList.length - inBudgetCount;

  if (sorted.length === 0) {
    return (
      <div className="absolute inset-0 z-10 bg-gray-50 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-4xl mb-3">🍺</div>
          <p className="text-sm font-semibold text-gray-700">条件に合うお店が見つかりません</p>
          <p className="text-xs text-gray-400 mt-1">検索ワードや予算を変えてみてください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 bg-gray-50 overflow-y-auto">
      {/* 検索バー分の余白 */}
      <div className="h-20" />

      {/* サマリーバー */}
      <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-4 py-2 flex items-center gap-2 z-10">
        <span className="text-xs font-semibold text-brand-600 bg-white rounded-full px-3 py-1 shadow-float">
          {inBudgetCount}件
          {outCount > 0 && (
            <span className="text-gray-400 font-normal ml-1">
              （+{outCount}件 予算外）
            </span>
          )}
        </span>
        {hhEnabled && (
          <span className="text-xs font-semibold text-amber-400 bg-gray-900 rounded-full px-3 py-1 shadow-float">
            HH価格表示中
          </span>
        )}
        <span className="text-xs text-gray-400 ml-auto">最安値順</span>
      </div>

      {/* 店舗リスト */}
      <div className="px-4 pt-2 pb-6 space-y-2">
        {sorted.map((pinData, idx) => {
          const { store, effectivePrice, isHH, isInBudget } = pinData;
          const isSelected = store.store_id === selectedStoreId;

          const rankBg =
            idx === 0
              ? "bg-amber-400 text-white"
              : idx === 1
              ? "bg-gray-300 text-gray-700"
              : idx === 2
              ? "bg-amber-700/70 text-white"
              : "bg-gray-100 text-gray-500";

          return (
            <button
              key={store.store_id}
              onClick={() => onStoreSelect(store.store_id)}
              className={`w-full text-left bg-white rounded-2xl px-4 py-3.5 shadow-float flex items-center gap-3 transition-all active:scale-[0.99] ${
                isSelected ? "ring-2 ring-brand-500" : "hover:shadow-lg"
              } ${!isInBudget ? "opacity-60" : ""}`}
            >
              {/* 順位バッジ */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${rankBg}`}
              >
                {idx + 1}
              </div>

              {/* 店舗情報 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-bold text-gray-900 truncate">{store.name}</p>
                  {store.hh_available && store.hh_time && (
                    <span className="text-[10px] bg-gray-900 text-amber-400 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                      HH {store.hh_time}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {areaLabel[store.area] ?? store.area}
                  {store.address && (
                    <span className="ml-1">
                      · {store.address.replace("東京都渋谷区", "").replace("東京都新宿区", "")}
                    </span>
                  )}
                </p>
              </div>

              {/* 最安価格 */}
              <div className="text-right flex-shrink-0">
                <div className="flex items-baseline gap-1 justify-end">
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
                <p className="text-[10px] text-gray-400">最安〜</p>
              </div>

              {/* シェブロン */}
              <svg
                className="w-4 h-4 text-gray-300 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
