"use client";

import { useState, useEffect, useCallback } from "react";
import type { StoreAnalytics } from "@/app/api/analytics/store/[storeId]/route";

// デモ用固定店舗ID（本番では認証ユーザーの store_id を使用）
const DEMO_STORE_ID = "shib-001";

type Period = "7d" | "30d";

// 日付文字列を「M/D」形式に変換
function fmtDate(iso: string, shortMode: boolean): string {
  const d = new Date(iso + "T00:00:00");
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (shortMode) return day % 5 === 0 || day === 1 ? `${m}/${day}` : "";
  return `${m}/${day}`;
}

// 前期間比の変化率
function deltaStr(curr: number, prev: number): { text: string; up: boolean } {
  if (prev === 0) return { text: "—", up: true };
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { text: `${pct > 0 ? "↑" : "↓"} ${Math.abs(pct)}% 前期比`, up: pct >= 0 };
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<StoreAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const storeId =
        (typeof window !== "undefined"
          ? localStorage.getItem("ownerStoreId")
          : null) ?? DEMO_STORE_ID;
      const res = await fetch(`/api/analytics/store/${storeId}?period=${p}`);
      if (!res.ok) throw new Error("取得失敗");
      const json: StoreAnalytics = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  // バーチャート用最大値
  const maxDaily  = data ? Math.max(...data.daily.map((d) => d.count), 1) : 1;
  const maxHourly = data ? Math.max(...data.hourly.map((h) => h.count), 1) : 1;

  // 夕方〜深夜帯のみ表示（17〜23時）
  const eveningHours = data?.hourly.filter((h) => h.hour >= 17 && h.hour <= 23) ?? [];

  const pvDelta = data ? deltaStr(data.total_views, data.prev_total_views) : null;

  // 地図クリック率（map_clicks / total_views）
  const mapClickRate =
    data && data.total_views > 0
      ? Math.round((data.map_clicks / data.total_views) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">アクセス分析</h1>
          <p className="text-sm text-gray-500 mt-0.5">ValueSip マップでの閲覧・行動データ</p>
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(["7d", "30d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs font-bold px-3 py-1.5 transition-colors ${
                period === p ? "bg-gray-900 text-white" : "bg-white text-gray-500"
              }`}
            >
              {p === "7d" ? "7日間" : "30日間"}
            </button>
          ))}
        </div>
      </div>

      {/* ローディング */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm animate-pulse">
          データを集計中…
        </div>
      )}

      {/* エラー */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* KPI カード */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">ページビュー</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.total_views.toLocaleString()}
              </p>
              {pvDelta && (
                <p className={`text-xs font-semibold mt-1 ${pvDelta.up ? "text-green-600" : "text-red-500"}`}>
                  {pvDelta.text}
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">地図クリック率</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{mapClickRate}%</p>
              <p className="text-xs text-gray-400 mt-1">{data.map_clicks} 件の経路確認</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">HH時間帯率</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.hh_hour_rate}%</p>
              <p className="text-xs text-amber-500 font-semibold mt-1">17〜19時のアクセス</p>
            </div>
          </div>

          {/* 日別PVバーチャート */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">
              日別ページビュー（直近{period === "7d" ? "7" : "30"}日）
            </h2>
            {data.total_views === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                まだデータがありません。店舗詳細ページへのアクセスが蓄積されると表示されます。
              </p>
            ) : (
              <div className="flex items-end justify-between gap-1 h-32">
                {data.daily.map((d) => {
                  const label = fmtDate(d.date, period === "30d");
                  return (
                    <div
                      key={d.date}
                      className="flex flex-col items-center gap-1 flex-1 min-w-0"
                      title={`${d.date}: ${d.count}PV`}
                    >
                      {d.count > 0 && (
                        <span className="text-[9px] text-gray-500 font-medium">{d.count}</span>
                      )}
                      <div
                        className="w-full rounded-t-sm bg-blue-400 transition-all"
                        style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? "2px" : "0" }}
                      />
                      <span className="text-[9px] text-gray-400 font-medium truncate w-full text-center">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 時間帯別アクセス */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">時間帯別アクセス（夕方〜深夜）</h2>
              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                HH 17–19時
              </span>
            </div>
            {eveningHours.every((h) => h.count === 0) ? (
              <p className="text-sm text-gray-400 text-center py-6">データなし</p>
            ) : (
              <div className="flex items-end justify-between gap-2 h-24">
                {eveningHours.map((h) => {
                  const isHH = h.hour >= 17 && h.hour <= 19;
                  return (
                    <div key={h.hour} className="flex flex-col items-center gap-1.5 flex-1">
                      {h.count > 0 && (
                        <span className="text-[10px] text-gray-500 font-medium">{h.count}</span>
                      )}
                      <div
                        className={`w-full rounded-t-md transition-all ${isHH ? "bg-amber-400" : "bg-gray-200"}`}
                        style={{ height: `${(h.count / maxHourly) * 100}%`, minHeight: h.count > 0 ? "2px" : "0" }}
                      />
                      <span className={`text-[10px] font-medium ${isHH ? "text-amber-600" : "text-gray-400"}`}>
                        {h.hour}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* アクション別カウント */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">ユーザーアクション</h2>
            <div className="space-y-3">
              {[
                { label: "店舗ページ閲覧", count: data.total_views, icon: "👀", color: "bg-blue-400" },
                { label: "地図・経路クリック", count: data.map_clicks, icon: "🗺️", color: "bg-green-400" },
                { label: "電話タップ",         count: data.phone_taps, icon: "📞", color: "bg-purple-400" },
              ].map((item) => {
                const pct = data.total_views > 0 ? (item.count / data.total_views) * 100 : 0;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-base w-6 flex-shrink-0">{item.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{item.label}</span>
                        <span className="text-gray-500 font-bold">{item.count} 件</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 改善ヒント */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-blue-900">💡 改善ヒント</h2>
            <div className="space-y-2">
              {data.hh_hour_rate >= 40 && (
                <p className="text-xs text-blue-700 flex gap-2">
                  <span className="flex-shrink-0 text-blue-400">•</span>
                  HH時間帯（17〜19時）のアクセスが{data.hh_hour_rate}%を占めています。ハッピーアワーのメニュー情報を充実させると転換率が上がります。
                </p>
              )}
              {mapClickRate < 20 && data.total_views > 10 && (
                <p className="text-xs text-blue-700 flex gap-2">
                  <span className="flex-shrink-0 text-blue-400">•</span>
                  地図クリック率が{mapClickRate}%です。住所・席数情報の充実で改善できます。
                </p>
              )}
              {mapClickRate >= 20 && (
                <p className="text-xs text-blue-700 flex gap-2">
                  <span className="flex-shrink-0 text-blue-400">•</span>
                  地図クリック率{mapClickRate}%は良好です。来店動機につながっています。
                </p>
              )}
              {data.total_views === 0 && (
                <p className="text-xs text-blue-700 flex gap-2">
                  <span className="flex-shrink-0 text-blue-400">•</span>
                  まだデータが蓄積されていません。ユーザーが店舗ページを閲覧するとここにデータが表示されます。
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
