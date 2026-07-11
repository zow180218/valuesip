"use client";

import { useState } from "react";
import Link from "next/link";
import type { Store, Menu } from "@/types/store";
import { effectiveMenuPrice } from "@/lib/filters";
import { isHHActiveNow } from "@/lib/hhSchedule";

interface StoreDetailSheetProps {
  store: Store;
  hhEnabled: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (storeId: string) => void;
}

export default function StoreDetailSheet({
  store,
  hhEnabled,
  onClose,
  isFavorite,
  onToggleFavorite,
}: StoreDetailSheetProps) {
  // 価格報告モーダル
  const [reportingMenu, setReportingMenu] = useState<Menu | null>(null);
  const [reportPrice, setReportPrice] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const hhActive = store.hh_available ? isHHActiveNow(store.hh_time) : false;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    store.name + " " + store.address
  )}`;

  // メニューをカテゴリ順にソート
  const categoryOrder = ["beer", "highball", "shochu", "wine", "cocktail", "other", "soft"];
  const sortedMenus = [...store.menus].sort(
    (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
  );

  const categoryLabel: Record<string, string> = {
    beer: "ビール",
    highball: "ハイボール",
    shochu: "サワー・焼酎",
    wine: "ワイン",
    cocktail: "カクテル",
    soft: "ソフトドリンク",
    other: "その他",
  };

  // 価格報告送信
  const handleReportSubmit = async () => {
    if (!reportingMenu || !reportPrice) return;
    const price = parseInt(reportPrice, 10);
    if (isNaN(price) || price <= 0) return;

    setReportStatus("sending");
    try {
      const res = await fetch("/api/report-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.store_id,
          menu_id: reportingMenu.id,
          reported_price: price,
          note: reportNote || undefined,
        }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      setReportStatus("done");
      setTimeout(() => {
        setReportingMenu(null);
        setReportPrice("");
        setReportNote("");
        setReportStatus("idle");
      }, 1800);
    } catch {
      setReportStatus("error");
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 animate-slide-up">
      <div className="bg-white rounded-t-3xl shadow-float max-h-[70vh] flex flex-col">
        {/* ハンドル */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* ヘッダー */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-gray-900 truncate">
                {store.name}
              </h2>
              {store.is_verified && (
                <span
                  className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  title="公式認証店舗"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l5.59-5.59L18 8l-7 7z"/>
                  </svg>
                  公式
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {store.hh_available && store.hh_time && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    hhActive
                      ? "bg-amber-500 text-white"
                      : "bg-gray-900 text-amber-400"
                  }`}
                >
                  {hhActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
                  )}
                  {hhActive ? `HH中 〜${store.hh_time?.split("〜")[1] ?? ""}` : `HH ${store.hh_time}`}
                </span>
              )}
              <span className="text-[11px] text-gray-400">
                更新: {store.data_updated_at}
              </span>
              {store.seats && (
                <span className="text-[11px] text-gray-400">約{store.seats}席</span>
              )}
            </div>
          </div>

          {/* ハートボタン + 閉じるボタン */}
          <div className="ml-3 flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onToggleFavorite(store.store_id)}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                isFavorite ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400 hover:text-red-400"
              }`}
              title={isFavorite ? "お気に入り解除" : "お気に入りに追加"}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* メニューリスト */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-5 py-3"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {sortedMenus.map((menu) => {
            const currentPrice = effectiveMenuPrice(menu, hhEnabled);
            const isHHApplied = hhEnabled && menu.hh_price !== undefined && menu.hh_price === currentPrice;

            return (
              <div
                key={menu.id}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm text-gray-800 truncate">{menu.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {categoryLabel[menu.category] ?? menu.category}
                    </span>
                    {menu.brand_tag && (
                      <span className="text-[10px] text-gray-400">{menu.brand_tag}</span>
                    )}
                    {menu.volume_ml && (
                      <span className="text-[10px] text-gray-400">{menu.volume_ml}ml</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    {isHHApplied ? (
                      <div>
                        <span className="text-base font-bold text-amber-500">
                          ¥{currentPrice.toLocaleString()}
                        </span>
                        <span className="ml-1 text-[10px] font-bold bg-gray-900 text-amber-400 px-1.5 py-0.5 rounded-full">
                          HH
                        </span>
                        <div className="text-[10px] text-gray-400 line-through">
                          ¥{menu.price.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-base font-bold text-gray-800">
                          ¥{currentPrice.toLocaleString()}
                        </span>
                        {menu.hh_price && !hhEnabled && (
                          <div className="text-[10px] text-amber-500">
                            HH ¥{menu.hh_price.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* 価格を報告 */}
                  <button
                    onClick={() => {
                      setReportingMenu(menu);
                      setReportPrice(currentPrice.toString());
                      setReportNote("");
                      setReportStatus("idle");
                    }}
                    className="text-gray-300 hover:text-brand-400 transition-colors"
                    title="価格を報告する"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* フッター（住所 + ボタン群） */}
        <div className="px-5 py-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-2.5 min-w-0">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <p className="text-xs text-gray-500 truncate">{store.address}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/stores/${store.store_id}`}
              className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 text-xs font-semibold px-3 py-2 rounded-full hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              店舗情報
            </Link>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-full hover:bg-brand-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              地図で開く
            </a>
          </div>
        </div>
      </div>

      {/* 価格報告モーダル */}
      {reportingMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setReportingMenu(null);
              setReportStatus("idle");
            }
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-8 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">価格を報告する</h3>
              <button
                onClick={() => { setReportingMenu(null); setReportStatus("idle"); }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-1">メニュー</p>
            <p className="text-sm font-semibold text-gray-800 mb-4">{reportingMenu.name}</p>

            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              実際の価格（税込）
            </label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3">
              <span className="text-sm text-gray-400 mr-1">¥</span>
              <input
                type="number"
                value={reportPrice}
                onChange={(e) => setReportPrice(e.target.value)}
                placeholder="例: 480"
                min={1}
                className="flex-1 text-sm text-gray-700 bg-transparent outline-none"
              />
            </div>

            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              メモ（任意）
            </label>
            <input
              type="text"
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              placeholder="例: 税抜価格でした / ランチは異なります"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none mb-4"
            />

            {reportStatus === "done" ? (
              <div className="flex items-center justify-center gap-2 py-2 text-green-600 text-sm font-semibold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ご報告ありがとうございます！
              </div>
            ) : (
              <button
                onClick={handleReportSubmit}
                disabled={!reportPrice || reportStatus === "sending"}
                className="w-full py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-full disabled:opacity-40 hover:bg-brand-600 transition-colors"
              >
                {reportStatus === "sending" ? "送信中…" : "報告する"}
              </button>
            )}

            {reportStatus === "error" && (
              <p className="text-center text-xs text-red-400 mt-2">送信に失敗しました。もう一度お試しください。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
