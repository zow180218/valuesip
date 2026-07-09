"use client";

import { useState, useRef } from "react";
import type { Store } from "@/types/store";

interface TopSearchBarProps {
  stores: Store[];
  searchText: string;
  onSearchChange: (v: string) => void;
  onStoreSuggestSelect: (storeId: string) => void;
  hhEnabled: boolean;
  onHhToggle: () => void;
  isFilterOpen: boolean;
  onFilterToggle: () => void;
  viewMode: "map" | "list";
  onViewModeToggle: () => void;
}

export default function TopSearchBar({
  stores,
  searchText,
  onSearchChange,
  onStoreSuggestSelect,
  hhEnabled,
  onHhToggle,
  isFilterOpen,
  onFilterToggle,
  viewMode,
  onViewModeToggle,
}: TopSearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 店舗名サジェスト（最大5件）
  const storeSuggestions = searchText.trim()
    ? stores
        .filter((s) =>
          s.name.toLowerCase().includes(searchText.toLowerCase().trim())
        )
        .slice(0, 5)
    : [];

  const handleSelect = (storeId: string) => {
    onStoreSuggestSelect(storeId);
    onSearchChange("");
    setShowSuggestions(false);
  };

  // onBlur より前に onMouseDown が発火するので、setTimeout で閉じる
  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2">
      {/* 検索インプット */}
      <div className="flex-1 relative">
        <div className="flex items-center bg-white rounded-full shadow-float px-4 py-2.5 gap-2">
          <svg
            className="w-4 h-4 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowSuggestions(false);
                inputRef.current?.blur();
              }
            }}
            placeholder="店舗名・ドリンクで検索…"
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          />
          {searchText && (
            <button
              onClick={() => {
                onSearchChange("");
                setShowSuggestions(false);
              }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* サジェストドロップダウン */}
        {showSuggestions && storeSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-float overflow-hidden z-30">
            {storeSuggestions.map((store, idx) => (
              <button
                key={store.store_id}
                onMouseDown={() => handleSelect(store.store_id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors ${
                  idx < storeSuggestions.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                {/* 店舗アイコン */}
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 22V12h6v10" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{store.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {store.area === "shibuya" ? "渋谷" : "新宿"}
                    {store.hh_available && store.hh_time && (
                      <span className="ml-2 text-amber-600 font-medium">
                        HH {store.hh_time}
                      </span>
                    )}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* マップ/リスト切替ボタン */}
      <button
        onClick={onViewModeToggle}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full shadow-float text-sm font-medium transition-colors ${
          viewMode === "list"
            ? "bg-brand-500 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
        title={viewMode === "map" ? "リスト表示" : "マップ表示"}
      >
        {viewMode === "map" ? (
          /* リストアイコン */
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        ) : (
          /* マップアイコン */
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        )}
      </button>

      {/* フィルターボタン */}
      <button
        onClick={onFilterToggle}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full shadow-float text-sm font-medium transition-colors ${
          isFilterOpen
            ? "bg-brand-500 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4h18M7 8h10M11 12h2M11 16h2" />
        </svg>
        <span className="hidden sm:inline">絞り込み</span>
        <svg
          className={`w-3 h-3 transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* HHトグル */}
      <button
        onClick={onHhToggle}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full shadow-float text-sm font-semibold transition-colors ${
          hhEnabled
            ? "bg-gray-900 text-amber-400"
            : "bg-white text-gray-500"
        }`}
        title={hhEnabled ? "HH価格表示中" : "通常価格表示中"}
      >
        <span className="text-[11px]">HH</span>
        <div
          className={`w-8 h-4 rounded-full transition-colors relative ${
            hhEnabled ? "bg-amber-500" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
              hhEnabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </div>
      </button>
    </div>
  );
}
