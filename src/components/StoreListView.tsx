"use client";

import type { StorePinData } from "@/types/store";
import DrinkSearchBar from "./DrinkSearchBar";

interface StoreListViewProps {
  pinDataList: StorePinData[];
  selectedStoreId: string | null;
  onStoreSelect: (storeId: string) => void;
  hhEnabled: boolean;
  compareItem: string | null;
  onCompareItemChange: (name: string | null) => void;
}

const areaLabel: Record<string, string> = {
  shibuya: "渋谷",
  shinjuku: "新宿",
  harajuku: "原宿",
  ebisu: "恵比寿",
  daikanyama: "代官山",
};

/** 選択メニューの価格を取得（HHトグル考慮）。取扱なしは null */
function getItemPrice(
  store: StorePinData["store"],
  itemName: string,
  hhEnabled: boolean
): number | null {
  const item = store.menus.find((m) => m.name === itemName);
  if (!item) return null;
  return hhEnabled && item.hh_price != null ? item.hh_price : item.price;
}

/** 選択メニューがHH価格かどうか */
function isItemHH(
  store: StorePinData["store"],
  itemName: string,
  hhEnabled: boolean
): boolean {
  if (!hhEnabled) return false;
  const item = store.menus.find((m) => m.name === itemName);
  return item?.hh_price != null;
}

export default function StoreListView({
  pinDataList,
  selectedStoreId,
  onStoreSelect,
  hhEnabled,
  compareItem,
  onCompareItemChange,
}: StoreListViewProps) {
  // DrinkSearchBar用に全店舗のStoreを渡す
  const allStores = pinDataList.map((d) => d.store);

  // ── ソート ──
  const sorted = [...pinDataList].sort((a, b) => {
    if (compareItem) {
      const ap = getItemPrice(a.store, compareItem, hhEnabled);
      const bp = getItemPrice(b.store, compareItem, hhEnabled);
      // 取扱なし → 最後尾
      if (ap === null && bp === null) return 0;
      if (ap === null) return 1;
      if (bp === null) return -1;
      return ap - bp;
    }
    // 通常ソート: 予算内優先 → HHあり優先 → 最安値順
    if (a.isInBudget !== b.isInBudget) return a.isInBudget ? -1 : 1;
    if (a.isHH !== b.isHH) return a.isHH ? -1 : 1;
    return a.effectivePrice - b.effectivePrice;
  });

  // ── 件数集計 ──
  const inBudgetCount = pinDataList.filter((d) => d.isInBudget).length;
  const outCount = pinDataList.length - inBudgetCount;
  const withItemCount = compareItem
    ? pinDataList.filter((d) => getItemPrice(d.store, compareItem, hhEnabled) !== null).length
    : null;
  const withoutItemCount = compareItem ? pinDataList.length - (withItemCount ?? 0) : null;

  // ── シェア ──
  const handleShare = () => {
    if (typeof navigator === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

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

      {/* スティッキーエリア */}
      <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-4 pt-2 pb-2 z-10 space-y-2">
        {/* メニュー横断比較バー */}
        <DrinkSearchBar
          stores={allStores}
          selectedDrink={compareItem}
          onDrinkSelect={onCompareItemChange}
        />

        {/* サマリーバー */}
        <div className="flex items-center gap-2">
          {compareItem ? (
            <>
              <span className="text-xs font-semibold text-brand-600 bg-white rounded-full px-3 py-1 shadow-float">
                {withItemCount}店舗で取扱
                {withoutItemCount != null && withoutItemCount > 0 && (
                  <span className="text-gray-400 font-normal ml-1">
                    （{withoutItemCount}店舗は取扱なし）
                  </span>
                )}
              </span>
              {hhEnabled && (
                <span className="text-xs font-semibold text-amber-400 bg-gray-900 rounded-full px-3 py-1 shadow-float">
                  HH価格表示中
                </span>
              )}
              {/* シェアボタン */}
              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-1 text-xs text-brand-500 bg-white rounded-full px-3 py-1 shadow-float hover:bg-brand-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                URLをシェア
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* 店舗リスト */}
      <div className="px-4 pt-2 pb-6 space-y-2">
        {sorted.map((pinData, idx) => {
          const { store, effectivePrice, isInBudget } = pinData;
          const isSelected = store.store_id === selectedStoreId;

          // 比較モード時の価格・HH状態
          const drinkPrice = compareItem
            ? getDrinkPrice(store, compareItem, hhEnabled)
            : null;
          const drinkIsHH = compareItem
            ? isDrinkHH(store, compareItem, hhEnabled)
            : pinData.isHH;
          const hasItem = compareItem ? drinkPrice !== null : true;

          // 表示価格
          const displayPrice = compareItem
            ? drinkPrice
            : effectivePrice;

          // 順位バッジ（取扱なし店舗はグレー固定）
          const rankBg =
            !hasItem
              ? "bg-gray-100 text-gray-400"
              : idx === 0
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
              } ${(!isInBudget && !compareItem) || !hasItem ? "opacity-50" : ""}`}
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
                  {store.is_verified && (
                    <span title="公式認証店舗" className="flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l5.59-5.59L18 8l-7 7z"/>
                      </svg>
                    </span>
                  )}
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

              {/* 価格エリア */}
              <div className="text-right flex-shrink-0">
                {!hasItem ? (
                  // 取扱なし
                  <p className="text-xs text-gray-400">取扱なし</p>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1 justify-end">
                      <span
                        className={`text-lg font-black ${
                          drinkIsHH ? "text-amber-500" : "text-brand-500"
                        }`}
                      >
                        ¥{displayPrice!.toLocaleString()}
                      </span>
                      {drinkIsHH && (
                        <span className="text-[10px] font-bold bg-gray-900 text-amber-400 px-1.5 py-0.5 rounded-full">
                          HH
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {compareItem ? "この価格" : "最安〜"}
                    </p>
                  </>
                )}
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
