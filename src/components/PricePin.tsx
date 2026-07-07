"use client";

import type { StorePinData } from "@/types/store";

interface PricePinProps {
  pinData: StorePinData;
  isSelected: boolean;
}

/**
 * マップ上の価格ピンコンポーネント
 *
 * デザイン仕様（2026-07-07確定）:
 *   通常店舗: 白地 × #378ADD (青) テキスト
 *   HH適用中: 黒地 × #F59E0B (アンバー) テキスト  ← オーナー指定
 *   予算外:   グレー地 × グレーテキスト（半透明）
 *   選択中:   青のリング追加
 */
export default function PricePin({ pinData, isSelected }: PricePinProps) {
  const { effectivePrice, isHH, isInBudget } = pinData;

  // ── スタイル決定 ──
  let containerClass =
    "relative flex flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-110";
  if (!isInBudget) containerClass += " opacity-40";

  let bubbleClass =
    "flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold shadow-pin whitespace-nowrap select-none";

  if (!isInBudget) {
    // 予算外: グレー
    bubbleClass += " bg-slate-200 text-slate-400";
  } else if (isHH) {
    // HH: 黒地 × アンバー文字
    bubbleClass += " bg-gray-900 text-amber-400";
    if (isSelected) bubbleClass += " ring-2 ring-amber-400 ring-offset-1";
  } else {
    // 通常: 白地 × ブランド青
    bubbleClass += " bg-white text-brand-500 border border-brand-200";
    if (isSelected) bubbleClass += " ring-2 ring-brand-500 ring-offset-1";
  }

  if (isSelected && !isHH && isInBudget) {
    bubbleClass = bubbleClass.replace("bg-white", "bg-brand-50");
  }

  return (
    <div className={containerClass}>
      <div className={bubbleClass}>
        ¥{effectivePrice.toLocaleString()}
        {isHH && (
          <span className="ml-1 text-[9px] text-amber-500 font-semibold">HH</span>
        )}
      </div>
      {/* 下向きの三角形（吹き出しのしっぽ） */}
      <div
        className="w-0 h-0"
        style={{
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
          borderTop: !isInBudget
            ? "5px solid #CBD5E1"
            : isHH
            ? "5px solid #111827"  // gray-900
            : "5px solid white",
        }}
      />
    </div>
  );
}
