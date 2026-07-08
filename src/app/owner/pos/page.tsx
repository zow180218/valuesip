"use client";

import { useState } from "react";

type Provider = "square" | "smaregi" | "airRegi" | "stores" | "csv" | "manual";

interface ProviderInfo {
  id: Provider;
  name: string;
  icon: string;
  description: string;
  status: "connected" | "available" | "coming_soon";
}

const PROVIDERS: ProviderInfo[] = [
  { id: "square", name: "Square", icon: "◼", description: "国内で広く使われるクラウドPOS", status: "connected" },
  { id: "smaregi", name: "スマレジ", icon: "🔴", description: "飲食店向け高機能POSシステム", status: "available" },
  { id: "airRegi", name: "Airレジ", icon: "🔵", description: "リクルート提供の無料POSアプリ", status: "available" },
  { id: "stores", name: "Stores.jp", icon: "🟠", description: "小規模店舗向けクラウドPOS", status: "coming_soon" },
  { id: "csv", name: "CSV インポート", icon: "📋", description: "メニュー一覧をCSVでアップロード", status: "available" },
  { id: "manual", name: "手動入力", icon: "✏️", description: "POSなしで直接メニューを登録", status: "available" },
];

const SQUARE_STEPS = [
  { label: "OAuth 認証", detail: "Square アカウントと連携済み", done: true },
  { label: "メニューマスタ取得", detail: "9 品目インポート済み（2026-07-07）", done: true },
  { label: "自動同期（日次）", detail: "毎日 06:00 に価格差分を自動チェック", done: true },
  { label: "Webhook リアルタイム同期", detail: "価格変更を即座に反映（設定推奨）", done: false, action: "設定する" },
];

const SYNC_LOGS = [
  { time: "2026-07-08 06:00", event: "日次同期完了", detail: "変更なし" },
  { time: "2026-07-07 14:32", event: "価格変更を検出", detail: "生ビール ¥600→¥620, 角ハイボール ¥530→¥550" },
  { time: "2026-07-07 06:00", event: "日次同期完了", detail: "2件の変更を反映" },
  { time: "2026-07-06 06:00", event: "日次同期完了", detail: "変更なし" },
];

export default function PosPage() {
  const [selected, setSelected] = useState<Provider>("square");
  const [csvDrag, setCsvDrag] = useState(false);
  const [webhookModal, setWebhookModal] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);

  const handleWebhookSave = async () => {
    await new Promise((r) => setTimeout(r, 800));
    setWebhookSaved(true);
    setTimeout(() => { setWebhookModal(false); setWebhookSaved(false); }, 1200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">POS 連携設定</h1>
        <p className="text-sm text-gray-500 mt-0.5">レジシステムとメニュー価格を自動同期します</p>
      </div>

      {/* プロバイダー選択 */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          POS レジを選択
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => p.status !== "coming_soon" && setSelected(p.id)}
              disabled={p.status === "coming_soon"}
              className={`text-left border-2 rounded-2xl p-4 transition-all ${
                selected === p.id
                  ? "border-blue-500 bg-blue-50"
                  : p.status === "connected"
                  ? "border-green-400 bg-green-50"
                  : p.status === "coming_soon"
                  ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className="text-sm font-bold text-gray-800">{p.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>
              <div className={`text-[10px] font-bold mt-2 ${
                p.status === "connected" ? "text-green-600"
                : p.status === "coming_soon" ? "text-gray-400"
                : "text-gray-500"
              }`}>
                {p.status === "connected" ? "✓ 連携済み"
                  : p.status === "coming_soon" ? "近日対応予定"
                  : "連携可能"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Square 詳細 */}
      {selected === "square" && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Square 連携状況</h2>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            {SQUARE_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${
                  step.done ? "bg-green-500 text-white" : "bg-amber-400 text-white"
                }`}>
                  {step.done ? "✓" : "!"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{step.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{step.detail}</p>
                </div>
                {step.action && !step.done && (
                  <button
                    onClick={() => setWebhookModal(true)}
                    className="flex-shrink-0 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    {step.action} →
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 同期ログ */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-900">同期ログ（直近 4 件）</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {SYNC_LOGS.map((log, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    log.event.includes("検出") ? "bg-amber-400" : "bg-green-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700">{log.event}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{log.detail}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Square 接続解除 */}
          <div className="flex justify-end">
            <button className="text-xs text-red-400 hover:text-red-600 font-semibold">
              Square との連携を解除する
            </button>
          </div>
        </div>
      )}

      {/* CSV インポート */}
      {selected === "csv" && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">CSV インポート</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div
              onDragOver={(e) => { e.preventDefault(); setCsvDrag(true); }}
              onDragLeave={() => setCsvDrag(false)}
              onDrop={(e) => { e.preventDefault(); setCsvDrag(false); alert("CSVを受け付けました（デモ）"); }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                csvDrag ? "border-blue-400 bg-blue-50" : "border-gray-200"
              }`}
            >
              <div className="text-3xl mb-3">📄</div>
              <p className="text-sm font-semibold text-gray-700">CSVファイルをドロップ</p>
              <p className="text-xs text-gray-400 mt-1">または</p>
              <label className="mt-3 inline-block bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">
                ファイルを選択
                <input type="file" accept=".csv" className="hidden" onChange={() => alert("CSVを受け付けました（デモ）")} />
              </label>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs font-bold text-gray-600 mb-2">CSVフォーマット例（UTF-8）</p>
              <pre className="text-[10px] text-gray-500 font-mono leading-relaxed">
{`name,category,price,hh_price,brand_tag,volume_ml
生ビール（中）,beer,620,480,サッポロ,500
角ハイボール,highball,550,420,サントリー,400
レモンサワー,shochu,480,380,,`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 手動入力 */}
      {selected === "manual" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center space-y-3">
          <div className="text-3xl">✏️</div>
          <p className="text-sm font-semibold text-gray-800">手動でメニューを管理する</p>
          <p className="text-xs text-gray-500">POS連携なしで、メニュー管理画面から直接価格を入力・更新できます。</p>
          <a
            href="/owner/stores/shib-001/menu"
            className="inline-block bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl"
          >
            メニュー管理へ →
          </a>
        </div>
      )}

      {/* スマレジ / Airレジ */}
      {(selected === "smaregi" || selected === "airRegi") && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-3">
          <div className="text-3xl">{selected === "smaregi" ? "🔴" : "🔵"}</div>
          <p className="text-sm font-bold text-gray-800">
            {selected === "smaregi" ? "スマレジ" : "Airレジ"} 連携の設定
          </p>
          <p className="text-xs text-gray-500">
            API キーを取得して入力してください。
          </p>
          <input
            type="text"
            placeholder="API キーを入力"
            className="w-full max-w-sm border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <button className="bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl">
              接続テスト
            </button>
          </div>
        </div>
      )}

      {/* Webhook 設定モーダル */}
      {webhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setWebhookModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-1">Webhook リアルタイム同期</h3>
            <p className="text-xs text-gray-500 mb-4">Square の Webhook に以下の URL を登録してください。</p>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 font-mono text-xs text-gray-700 break-all mb-4">
              https://valuesip.vercel.app/api/pos/webhook/square
            </div>
            <p className="text-xs text-gray-500 mb-4">対象イベント: <code>catalog.version.updated</code></p>
            {webhookSaved ? (
              <div className="text-center text-sm text-green-600 font-bold">✅ 設定しました</div>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleWebhookSave} className="flex-1 bg-gray-900 text-white text-sm font-bold py-2.5 rounded-xl">
                  設定済みにする
                </button>
                <button onClick={() => setWebhookModal(false)} className="px-4 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl">
                  閉じる
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
