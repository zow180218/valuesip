"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { FilterState, Store, AreaId } from "@/types/store";
import { SAMPLE_STORES } from "@/data/stores";
import { filterStores, DEFAULT_FILTER } from "@/lib/filters";
import { getFavoriteIds, toggleFavoriteId } from "@/lib/favorites";
import TopSearchBar from "@/components/TopSearchBar";
import FilterPanel from "@/components/FilterPanel";
import BottomCardStrip from "@/components/BottomCardStrip";
import StoreDetailSheet from "@/components/StoreDetailSheet";
import StoreListView from "@/components/StoreListView";

// MapViewはSSRで動かないのでdynamic importでクライアント専用に
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

// エリアのデフォルトマップ中心座標
const AREA_CENTERS: Record<AreaId, { lat: number; lng: number }> = {
  shibuya: { lat: 35.6580, lng: 139.7015 },
  shinjuku: { lat: 35.6895, lng: 139.7006 },
};

export default function Home() {
  // ── 店舗データ（Supabase接続時はAPIから、未接続時はサンプルデータ） ──
  const [stores, setStores] = useState<Store[]>(
    SAMPLE_STORES.filter((s) => s.area === "shibuya")
  );
  const [isLoadingStores, setIsLoadingStores] = useState(false);

  // ── エリア選択 ──
  const [selectedArea, setSelectedArea] = useState<AreaId>("shibuya");

  // ── お気に入り（localStorage から初期化） ──
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<Set<string>>(() =>
    getFavoriteIds()
  );

  // ── マップパン（サジェスト選択時 / 現在地再センタリング） ──
  const [mapCenter, setMapCenter] = useState<
    { lat: number; lng: number; key: string } | undefined
  >(undefined);

  // ── 現在地 ──
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // ── 表示モード（URLの ?compare= を初回レンダーで読んで初期化） ──
  const [viewMode, setViewMode] = useState<"map" | "list">(() => {
    if (typeof window === "undefined") return "map";
    return new URLSearchParams(window.location.search).has("compare") ? "list" : "map";
  });

  // ── ドリンク比較（URLから初期化） ──
  const [compareDrink, setCompareDrink] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("compare") ?? null;
  });

  // compareDrink変化時にURLを更新
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (compareDrink) {
      params.set("compare", compareDrink);
    } else {
      params.delete("compare");
    }
    const newSearch = params.toString();
    window.history.replaceState(
      {},
      "",
      newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname
    );
  }, [compareDrink]);

  // 起動時にGPS取得
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setMapCenter({ ...loc, key: "user-location-init" });
      },
      () => {
        // 拒否・タイムアウト → エリアデフォルト座標のまま
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // 現在地ボタン → 地図を現在地に再センタリング
  const handleRecenterUser = useCallback(() => {
    if (!userLocation) return;
    setMapCenter({ ...userLocation, key: "user-location-" + Date.now() });
  }, [userLocation]);

  // APIから最新データを取得（Supabase設定済みの場合のみ有効）
  const fetchStores = useCallback(async (area: AreaId = "shibuya") => {
    setIsLoadingStores(true);
    try {
      const res = await fetch(`/api/stores?area=${area}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { stores: Store[] } = await res.json();
      if (data.stores.length > 0) {
        setStores(data.stores);
      } else {
        // Supabaseにデータがない場合はサンプルデータで補完
        setStores(SAMPLE_STORES.filter((s) => s.area === area));
      }
    } catch (err) {
      console.warn("[page] API fetch failed, using sample data:", err);
      setStores(SAMPLE_STORES.filter((s) => s.area === area));
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
    () => filterStores(stores, filter, favoriteStoreIds),
    [stores, filter, favoriteStoreIds]
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

  const handleListStoreSelect = (storeId: string) => {
    const store = stores.find((s) => s.store_id === storeId);
    setSelectedStoreId(storeId);
    setViewMode("map");
    setIsFilterOpen(false);
    if (store) {
      setMapCenter({ lat: store.lat, lng: store.lng, key: storeId + "-" + Date.now() });
    }
  };

  const handleStoreSuggestSelect = (storeId: string) => {
    const store = stores.find((s) => s.store_id === storeId);
    setSelectedStoreId(storeId);
    setIsFilterOpen(false);
    setViewMode("map");
    if (store) {
      setMapCenter({ lat: store.lat, lng: store.lng, key: storeId + "-" + Date.now() });
    }
  };

  const handleFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  // エリア切替
  const handleAreaChange = useCallback((area: AreaId) => {
    if (area === selectedArea) return;
    setSelectedArea(area);
    setSelectedStoreId(null);
    setIsFilterOpen(false);
    setMapCenter({ ...AREA_CENTERS[area], key: "area-change-" + Date.now() });
    fetchStores(area);
  }, [selectedArea, fetchStores]);

  // お気に入りトグル
  const handleToggleFavorite = useCallback((storeId: string) => {
    setFavoriteStoreIds((prev) => toggleFavoriteId(prev, storeId));
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* ① マップ（全画面ベース・リスト表示時は hidden で state 保持） */}
      <div className={`absolute inset-0 ${viewMode !== "map" ? "hidden" : ""}`}>
        <MapView
          pinDataList={pinDataList}
          selectedStoreId={selectedStoreId}
          onStoreSelect={handleStoreSelect}
          onMapMoved={() => {
            if (selectedStoreId) setSelectedStoreId(null);
          }}
          centerOn={mapCenter}
          userLocation={userLocation}
        />
      </div>

      {/* ①' リスト表示 */}
      {viewMode === "list" && (
        <StoreListView
          pinDataList={pinDataList}
          selectedStoreId={selectedStoreId}
          onStoreSelect={handleListStoreSelect}
          hhEnabled={filter.hhEnabled}
          compareDrink={compareDrink}
          onCompareDrinkChange={setCompareDrink}
        />
      )}

      {/* ② 上部検索バー（フローティング） */}
      <TopSearchBar
        stores={stores}
        searchText={filter.searchText}
        onSearchChange={(v) => handleFilterChange("searchText", v)}
        onStoreSuggestSelect={handleStoreSuggestSelect}
        hhEnabled={filter.hhEnabled}
        onHhToggle={() => handleFilterChange("hhEnabled", !filter.hhEnabled)}
        isFilterOpen={isFilterOpen}
        onFilterToggle={() => {
          setIsFilterOpen((prev) => !prev);
          if (selectedStoreId) setSelectedStoreId(null);
        }}
        viewMode={viewMode}
        onViewModeToggle={() => {
          setViewMode((prev) => (prev === "map" ? "list" : "map"));
          setSelectedStoreId(null);
          setIsFilterOpen(false);
        }}
        selectedArea={selectedArea}
        onAreaChange={handleAreaChange}
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
          favoritesOnly={filter.favoritesOnly}
          onFavoritesOnlyChange={(v) => handleFilterChange("favoritesOnly", v)}
          favoriteCount={favoriteStoreIds.size}
        />
      )}

      {/* ④ 下部カードストリップ（マップ表示 かつ 詳細シートが閉じている時のみ） */}
      {viewMode === "map" && !selectedStore && (
        <BottomCardStrip
          pinDataList={pinDataList}
          selectedStoreId={selectedStoreId}
          onStoreSelect={handleStoreSelect}
          hhEnabled={filter.hhEnabled}
          favoriteStoreIds={favoriteStoreIds}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* ⑤ 店舗詳細シート（スライドアップ） */}
      {selectedStore && (
        <StoreDetailSheet
          store={selectedStore}
          hhEnabled={filter.hhEnabled}
          onClose={() => setSelectedStoreId(null)}
          isFavorite={favoriteStoreIds.has(selectedStore.store_id)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* ⑥ 現在地ボタン（GPS取得済み かつ マップ表示時のみ） */}
      {userLocation && viewMode === "map" && (
        <button
          onClick={handleRecenterUser}
          className="absolute bottom-40 right-4 z-20 w-11 h-11 bg-white rounded-full shadow-float flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
          title="現在地に戻る"
        >
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="7" strokeWidth={1.5} strokeDasharray="2 2" />
          </svg>
        </button>
      )}

      {/* ローディングインジケーター */}
      {isLoadingStores && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-white/90 rounded-full px-4 py-1.5 text-xs text-gray-500 shadow-float pointer-events-none">
          データ更新中…
        </div>
      )}
    </main>
  );
}
