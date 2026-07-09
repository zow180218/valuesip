"use client";

import { useState, useRef } from "react";
import type { Store } from "@/types/store";

interface DrinkSearchBarProps {
  stores: Store[];
  selectedDrink: string | null;
  onDrinkSelect: (name: string | null) => void;
}

export default function DrinkSearchBar({
  stores,
  selectedDrink,
  onDrinkSelect,
}: DrinkSearchBarProps) {
  const [inputText, setInputText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 全店舗のメニュー名を集約・重複除去・五十音順ソート
  const allDrinkNames = Array.from(
    new Set(stores.flatMap((s) => s.menus.map((m) => m.name)))
  ).sort((a, b) => a.localeCompare(b, "ja"));

  // ドリンク名 → 取扱店舗数マップ
  const storeCountMap = new Map<string, number>();
  for (const s of stores) {
    for (const m of s.menus) {
      storeCountMap.set(m.name, (storeCountMap.get(m.name) ?? 0) + 1);
    }
  }

  const q = inputText.toLowerCase().trim();
  const suggestions = (
    q
      ? allDrinkNames.filter((name) => name.toLowerCase().includes(q))
      : allDrinkNames
  ).slice(0, 8);

  const handleSelect = (name: string) => {
    onDrinkSelect(name);
    setInputText("");
    setShowSuggestions(false);
  };

  const handleBlur = () => setTimeout(() => setShowSuggestions(false), 150);

  // ── 選択済み表示 ──
  if (selectedDrink) {
    return (
      <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2">
        <svg
          className="w-4 h-4 text-brand-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-semibold text-brand-700 flex-1 truncate">
          {selectedDrink}
        </span>
        <button
          onClick={() => onDrinkSelect(null)}
          className="text-brand-300 hover:text-brand-500 flex-shrink-0"
          title="比較を解除"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    );
  }

  // ── 検索入力 ──
  return (
    <div className="relative">
      <div className="flex items-center bg-white rounded-full shadow-float px-4 py-2.5 gap-2">
        {/* グラスアイコン */}
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
            d="M5 3h14l-2 14H7L5 3zM8 17v4m8-4v4M6 21h12"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
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
          placeholder="ドリンクを選んで店舗を比較…"
          className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
        />
        {inputText && (
          <button
            onClick={() => setInputText("")}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* サジェストドロップダウン */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-float overflow-hidden z-30 max-h-64 overflow-y-auto">
          {!q && (
            <div className="px-4 py-2 text-[11px] text-gray-400 border-b border-gray-100">
              取扱ドリンク一覧
            </div>
          )}
          {suggestions.map((name, idx) => {
            const count = storeCountMap.get(name) ?? 0;
            return (
              <button
                key={name}
                onMouseDown={() => handleSelect(name)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors ${
                  idx < suggestions.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 3h14l-2 14H7L5 3zM8 17v4m8-4v4M6 21h12"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {count}店舗で取扱
                  </p>
                </div>
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
      )}
    </div>
  );
}
