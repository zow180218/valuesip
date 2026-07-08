"use client";

import { useState } from "react";
import Link from "next/link";
import { SAMPLE_STORES } from "@/data/stores";
import { effectiveMenuPrice } from "@/lib/filters";

const DEMO_STORE_ID = "shib-001";

const WEEKLY_STATS = {
  pageViews: 312,
  pageViewsDelta: 18,
  mapClicks: 87,
  mapClicksDelta: 5,
  hhAccess: 194,
  hhAccessPct: 62,
  menuCount: 9,
  lastUpdated: "今日",
};

const RECENT_SYNCS = [
  { name: "生ビール（中）", oldPrice: 600, newPrice: 620, hhPrice: 480, source: "POS同期", time: "2時間前" },
  { name: "角ハイボール", oldPrice: 530, newPrice: 550, hhPrice: 420, source: "POS同期", time: "2時間前" },
  { name: "レモンサワー", oldPrice: 480, newPrice: 480, hhPrice: 380, source: "手動入力", time: "昨日" },
];

export default function OwnerDashboardPage() {
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const store = SAMPLE_STORES.find((s) => s.store_id === DEMO_STORE_ID);

  const handleSync = async () => {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSyncing(false);
    setSynced(true);
  };

  return (
    <div className="space-y-5">
      {/* ページタイトル */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-0.5">{store?.name ?? "店舗"} の集計概要</p>
      </div>

      {/* POS同期通知バナー */}
      {!synced ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">🔄</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">POS データに更新があります</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Square から価格変更 2 件が検出されました。ValueSip に反映しますか？
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex-shrink-0 bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-60"
          >
            {syncing ? "同期中…" : "今すぐ反映"}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <p className="text-sm font-semibold text-green-800">POS データを反映しました</p>
        </div>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "週間ページ表示",
            value: WEEKLY_STATS.pageViews,
            sub: `↑ ${WEEKLY_STATS.pageViewsDelta}% 先週比`,
            color: "text-green-600",
          },
          {
            label: "地図クリック数",
            value: WEEKLY_STATS.mapClicks,
            sub: `↑ ${WEEKLY_STATS.mapClicksDelta}% 先週比`,
            color: "text-green-600",
          },
          {
            label: "HH時間帯アクセス",
            value: WEEKLY_STATS.hhAccess,
            sub: `全体の ${WEEKLY_STATS.hhAccessPct}%`,
            color: "text-amber-600",
          },
          {
            label: "メニュー掲載数",
            value: WEEKLY_STATS.menuCount,
            sub: `最終更新: ${WEEKLY_STATS.lastUpdated}`,
            color: "text-gray-400",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className={`text-xs mt-1 font-medium ${stat.color}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "店舗情報を編集", href: `/owner/stores/${DEMO_STORE_ID}/edit`, icon: "🏪" },
          { label: "メニューを管理", href: `/owner/stores/${DEMO_STORE_ID}/menu`, icon: "📋" },
          { label: "POS 連携設定", href: "/owner/pos", icon: "💳" },
          { label: "分析を見る", href: "/owner/analytics", icon: "📊" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="text-xs font-semibold text-gray-700 text-center">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* 最近の変更 */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">最近のメニュー変更</h2>
          <Link href={`/owner/stores/${DEMO_STORE_ID}/menu`} className="text-xs text-blue-600 hover:underline">
            すべて見る →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {RECENT_SYNCS.map((item, i) => (
            <div key={i} className="flex items-center px-5 py-3.5 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
              </div>
              <div className="text-right">
                {item.oldPrice !== item.newPrice ? (
                  <div>
                    <span className="text-xs text-gray-400 line-through">¥{item.oldPrice}</span>
                    <span className="text-sm font-bold text-gray-800 ml-1.5">¥{item.newPrice}</span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-gray-800">¥{item.newPrice}</span>
                )}
                {item.hhPrice && (
                  <p className="text-xs text-amber-500 font-semibold">HH ¥{item.hhPrice}</p>
                )}
              </div>
              <span
                className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.source === "POS同期"
                    ? "bg-green-100 text-green-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {item.source}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* HH 設定サマリー */}
      {store?.hh_available && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍻</span>
              <div>
                <p className="text-sm font-bold text-gray-900">ハッピーアワー設定中</p>
                <p className="text-xs text-gray-500 mt-0.5">{store.hh_time}</p>
              </div>
            </div>
            <Link
              href={`/owner/stores/${DEMO_STORE_ID}/edit`}
              className="text-xs text-blue-600 hover:underline"
            >
              時間を変更 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
