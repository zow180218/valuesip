"use client";

interface TopSearchBarProps {
  searchText: string;
  onSearchChange: (v: string) => void;
  hhEnabled: boolean;
  onHhToggle: () => void;
  isFilterOpen: boolean;
  onFilterToggle: () => void;
}

export default function TopSearchBar({
  searchText,
  onSearchChange,
  hhEnabled,
  onHhToggle,
  isFilterOpen,
  onFilterToggle,
}: TopSearchBarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2">
      {/* 検索インプット */}
      <div className="flex-1 flex items-center bg-white rounded-full shadow-float px-4 py-2.5 gap-2">
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
          type="text"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ハイボール、生ビール…"
          className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
        />
        {searchText && (
          <button
            onClick={() => onSearchChange("")}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

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
