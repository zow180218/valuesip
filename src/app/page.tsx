"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { FilterState, Store } from "@/types/store";
import { SAMPLE_STORES } from "@/data/stores";
import { filterStores, DEFAULT_FILTER } from "@/lib/filters";
import TopSearchBar from "@/components/TopSearchBar";
import FilterPanel from "@/components/FilterPanel";
import BottomCardStrip from "@/components/BottomCardStrip";
import StoreDetailSheet from "@/components/StoreDetailSheet";

// MapViewはSSRで動かないのでdynamic importでクライアント専用に
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function Home() {
  // ── 店舗データ（Supabase接続時はAPIから、未接続時はサンプルデータ） ──
  const [stores, setStores] = useState<Store[]>(SAMPLE_STORES);
  const [isLoadingStores, setIsLoadingStores] = useState(false);

  // APIから最新データを取得（Supabase設定済みの場合のみ有効）
  const fetchStores = useCallback(async (area = "shibuya") => {
    setIsLoadingStores(true);
    try {
      const res = await fetch(`/api/stores?area=${area}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { stores: Store[] } = await res.json();
      if (data.stores.length > 0) setStores(data.stores);
    } catch (err) {
      // フォールバック：サンプルデータをそのまま使う
      console.warn("[page] API fetch failed, using sample data:", err);
    } finally {
      setIsLoadingStores(false);
    }
  }, []);

  useEffect(() => {
    fetchStores("shibuya");
  }, [fetchStores]);

  // ── フィルター状態 ──
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ── 選択中の店舗 ──
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // ── フィルター適用済みピンデータ（メモ化） ──
  const pinDataList = useMemo(
    () => filterStores(stores, filter),
    [stores, filter]
  );

  // ── 選択中の店舗オブジェクト ──
  const selectedStore = useMemo(
    () =>
      selectedStoreId
        ? stores.find((s) => s.store_id === selectedStoreId) ?? null
        : null,
    [stores, selectedStoreId]
  );

  // ── ハンドラー ──
  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId((prev) => (prev === storeId ? null : storeId));
    setIsFilterOpen(false);
  };

  const handleFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* ① マップ（全画面ベース） */}
      <div className="absolute inset-0">
        <MapView
          pinDataList={pinDataList}
          selectedStoreId={selectedStoreId}
          onStoreSelect={handleStoreSelect}
          onMapMoved={() => {
            if (selectedStoreId) setSelectedStoreId(null);
          }}
        />
      </div>

      {/* ② 上部検索バー（フローティング） */}
      <TopSearchBar
        searchText={filter.searchText}
        onSearchChange={(v) => handleFilterChange("searchText", v)}
        hhEnabled={filter.hhEnabled}
        onHhToggle={() =>
          handleFilterChange("hhEnabled", !filter.hhEnabled)
        }
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => {
          setIsFilterOpen((prev) => !prev);
          if (selectedStoreId) setSelectedStoreId(null);
        }}
      />

      {/* ③ フィルターパネル（スライドダウン） */}
      {isFilterOpen && (
        <FilterPanel
          excludeText={filter.excludeText}
          onExcludeChange={(v) => handleFilterChange("excludeText", v)}
          minBudget={filter.minBudget}
          maxBudget={filter.maxBudget}
          onMinBudgetChange={(v) => handleFilterChange("minBudget", v)}
          onMaxBudgetChange={(v) => handleFilterChange("maxBudget", v)}
        />
      )}

      {/* ④ 下部カードストリップ（詳細シートが開いていない時のみ） */}
      {!selectedStore && (
        <BottomCardStrip
          pinDataList={pinDataList}
          selectedStoreId={selectedStoreId}
          onStoreSelect={handleStoreSelect}
          hhEnabled={filter.hhEnabled}
        />
      )}

      {/* ⑤ 店舗詳細シート（スライドアップ） */}
      {selectedStore && (
        <StoreDetailSheet
          store={selectedStore}
          hhEnabled={filter.hhEnabled}
          onClose={() => setSelectedStoreId(null)}
        />
      )}

      {/* ローディングインジケーター（任意） */}
      {isLoadingStores && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-white/90 rounded-full px-4 py-1.5 text-xs text-gray-500 shadow-float pointer-events-none">
          データ更新中…
        </div>
      )}
    </main>
  );
}
