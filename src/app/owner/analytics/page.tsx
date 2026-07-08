"use client";

import { useState } from "react";

const WEEKLY_PV = [
  { day: "月", pv: 38 },
  { day: "火", pv: 52 },
  { day: "水", pv: 44 },
  { day: "木", pv: 61 },
  { day: "金", pv: 78 },
  { day: "土", pv: 89 },
  { day: "日", pv: 57 },
];

const MAX_PV = Math.max(...WEEKLY_PV.map((d) => d.pv));

const FUNNEL = [
  { label: "マップ閲覧", count: 312, pct: 100, color: "bg-blue-200" },
  { label: "店舗タップ（ピン）", count: 214, pct: 68, color: "bg-blue-300" },
  { label: "詳細シート展開", count: 156, pct: 50, color: "bg-blue-400" },
  { label: "地図クリック（経路）", count: 87, pct: 28, color: "bg-blue-500" },
];

const FLOW_IN = [
  { label: "検索フィルター経由", pct: 48 },
  { label: "地図ピン直接タップ", pct: 33 },
  { label: "URL直接アクセス", pct: 19 },
];

const HOURLY = [
  { hour: "17", pv: 42 },
  { hour: "18", pv: 89 },
  { hour: "19", pv: 103 },
  { hour: "20", pv: 78 },
  { hour: "21", pv: 55 },
  { hour: "22", pv: 34 },
  { hour: "23", pv: 17 },
];
const MAX_HOURLY = Math.max(...HOURLY.map((h) => h.pv));

type Period = "7d" | "30d";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("7d");

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* KPI カード */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "週間PV", value: period === "7d" ? 312 : 1240, delta: 18, color: "text-green-600" },
          { label: "地図クリック", value: period === "7d" ? 87 : 342, delta: 5, color: "text-green-600" },
          { label: "HH時間帯率", value: null, pct: 62, color: "text-amber-600" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
            {kpi.value !== null ? (
              <>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value.toLocaleString()}</p>
                <p className={`text-xs font-semibold mt-1 ${kpi.color}`}>
                  ↑ {kpi.delta}% 先週比
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.pct}%</p>
                <p className={`text-xs font-semibold mt-1 ${kpi.color}`}>
                  HH時間帯のアクセス
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 日別 PV バーチャート */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">日別ページビュー（直近7日）</h2>
        <div className="flex items-end justify-between gap-2 h-32">
          {WEEKLY_PV.map((d) => (
            <div key={d.day} className="flex flex-col items-center gap-1.5 flex-1">
              <span className="text-[10px] text-gray-500 font-medium">{d.pv}</span>
              <div
                className="w-full rounded-t-md bg-blue-400 transition-all"
                style={{ height: `${(d.pv / MAX_PV) * 100}%` }}
              />
              <span className="text-[10px] text-gray-400 font-medium">{d.day}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-3 text-right">※ デモデータ</p>
      </div>

      {/* 時間帯別アクセス（HH強調） */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900">時間帯別アクセス（夕方〜深夜）</h2>
          <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
            HH 17–19時
          </span>
        </div>
        <div className="flex items-end justify-between gap-2 h-24">
          {HOURLY.map((h) => {
            const isHH = parseInt(h.hour) >= 17 && parseInt(h.hour) <= 19;
            return (
              <div key={h.hour} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[10px] text-gray-500 font-medium">{h.pv}</span>
                <div
                  className={`w-full rounded-t-md transition-all ${isHH ? "bg-amber-400" : "bg-gray-200"}`}
                  style={{ height: `${(h.pv / MAX_HOURLY) * 100}%` }}
                />
                <span className={`text-[10px] font-medium ${isHH ? "text-amber-600" : "text-gray-400"}`}>
                  {h.hour}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* コンバージョンファネル */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">コンバージョンファネル</h2>
        <div className="space-y-2.5">
          {FUNNEL.map((step, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-700 font-medium">{step.label}</span>
                <span className="text-gray-500">{step.count} <span className="text-gray-400">({step.pct}%)</span></span>
              </div>
              <div className="h-5 bg-gray-50 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${step.color} rounded-lg transition-all`}
                  style={{ width: `${step.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-gray-500">
            地図クリック率（経路案内）: <span className="font-bold text-gray-800">28%</span>
          </p>
        </div>
      </div>

      {/* 流入元 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">流入元（タップ経路）</h2>
        <div className="space-y-3">
          {FLOW_IN.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 flex-shrink-0">
                <p className="text-xs text-gray-600 font-medium">{item.label}</p>
              </div>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-700 w-8 text-right">{item.pct}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          ヒント: フィルター検索経由が最多。タグ設定を最適化するとさらに表示が増える可能性があります。
        </p>
      </div>

      {/* 改善サジェスト */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-blue-900">💡 改善ヒント</h2>
        <div className="space-y-2">
          {[
            "HH 19時のアクセスが最多 → 19時台の限定メニューをメニュー管理で追加すると転換率が上がる可能性があります",
            "地図クリック率が 28% → 店舗写真や席数情報の充実で改善できます（近日対応予定）",
            "フィルター経由が 48% → ビアホールタグの最適化でさらに表示回数が増加します",
          ].map((tip, i) => (
            <p key={i} className="text-xs text-blue-700 flex gap-2">
              <span className="flex-shrink-0 text-blue-400">•</span>
              {tip}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
