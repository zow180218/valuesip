"use client";

interface FilterPanelProps {
  excludeText: string;
  onExcludeChange: (v: string) => void;
  minBudget: number;
  maxBudget: number;
  onMinBudgetChange: (v: number) => void;
  onMaxBudgetChange: (v: number) => void;
}

export default function FilterPanel({
  excludeText,
  onExcludeChange,
  minBudget,
  maxBudget,
  onMinBudgetChange,
  onMaxBudgetChange,
}: FilterPanelProps) {
  return (
    <div className="absolute top-[72px] left-4 right-4 z-10 bg-white rounded-2xl shadow-float p-4 animate-slide-down">
      <div className="flex flex-col gap-4">

        {/* 除外ワード */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            除外ワード
          </label>
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 gap-2">
            <span className="text-gray-400 text-sm select-none">−</span>
            <input
              type="text"
              value={excludeText}
              onChange={(e) => onExcludeChange(e.target.value)}
              placeholder="例: 角　（特定銘柄を除く）"
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none"
            />
            {excludeText && (
              <button
                onClick={() => onExcludeChange("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 予算（下限・上限） */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            予算（1杯あたり）
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1">
              <span className="text-xs text-gray-400 mr-1">¥</span>
              <input
                type="number"
                value={minBudget || ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  onMinBudgetChange(isNaN(v) ? 0 : v);
                }}
                placeholder="0"
                min={0}
                max={maxBudget}
                className="flex-1 text-sm text-gray-700 bg-transparent outline-none w-0 min-w-0"
              />
            </div>
            <span className="text-gray-400 text-sm">〜</span>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1">
              <span className="text-xs text-gray-400 mr-1">¥</span>
              <input
                type="number"
                value={maxBudget || ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  onMaxBudgetChange(isNaN(v) ? 0 : v);
                }}
                placeholder="800"
                min={minBudget}
                className="flex-1 text-sm text-gray-700 bg-transparent outline-none w-0 min-w-0"
              />
            </div>
          </div>
          {/* クイックセット */}
          <div className="flex gap-1.5 mt-2">
            {[300, 500, 800, 1000].map((v) => (
              <button
                key={v}
                onClick={() => onMaxBudgetChange(v)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  maxBudget === v
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                ¥{v}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
