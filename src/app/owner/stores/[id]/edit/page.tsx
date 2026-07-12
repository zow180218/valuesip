"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { SAMPLE_STORES } from "@/data/stores";
import type { Store } from "@/types/store";

// ──────────────────────────────────────────
// CSV ヘルパー
// ──────────────────────────────────────────

interface CsvRow {
  name: string;
  category: string;
  price: string;
  hh_price: string;
  volume_ml: string;
  brand_tag: string;
}

/** 軽量 CSV パーサー（ヘッダー行必須, 引用符未対応） */
function parseCSV(text: string): CsvRow[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    return {
      name: vals[headers.indexOf("name")] ?? "",
      category: vals[headers.indexOf("category")] ?? "",
      price: vals[headers.indexOf("price")] ?? "",
      hh_price: vals[headers.indexOf("hh_price")] ?? "",
      volume_ml: vals[headers.indexOf("volume_ml")] ?? "",
      brand_tag: vals[headers.indexOf("brand_tag")] ?? "",
    };
  });
}

const CSV_TEMPLATE = [
  "name,category,price,hh_price,volume_ml,brand_tag",
  "生ビール（中）,beer,600,400,350,一番搾り",
  "角ハイボール,highball,480,380,300,角",
  "サワー（レモン）,shochu,450,350,,",
].join("\n");

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "menu_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────

export default function StoreEditPage() {
  const params = useParams();
  const storeId = params?.id as string;

  // ── 店舗情報フォーム ──
  const [store, setStore] = useState<Store | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    seats: "",
    hh_available: false,
    hh_time: "",
    open_hours: "",
    closed_days: "",
    is_verified: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── CSV インポート ──
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvRows, setCsvRows] = useState<CsvRow[] | null>(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    const found = SAMPLE_STORES.find((s) => s.store_id === storeId) ?? SAMPLE_STORES[0];
    setStore(found);
    setForm({
      name: found.name,
      address: found.address,
      phone: found.phone ?? "",
      seats: found.seats ? String(found.seats) : "",
      hh_available: found.hh_available,
      hh_time: found.hh_time ?? "",
      open_hours: found.open_hours ?? "",
      closed_days: found.closed_days ?? "",
      is_verified: found.is_verified ?? false,
    });
  }, [storeId]);

  const handleChange = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setSaveError(null);
  };

  // ── 店舗情報保存 ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    try {
      const { getAuthHeaders } = await import("@/lib/auth");
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/owner/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  // ── CSV ファイル選択 ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setImportResult(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setCsvRows(rows);
    };
    reader.readAsText(file, "utf-8");
  };

  // ── CSV インポート実行 ──
  const handleImport = async () => {
    if (!csvRows || csvRows.length === 0) return;
    setImporting(true);
    setImportResult(null);
    setImportError(null);

    try {
      const { getAuthHeaders } = await import("@/lib/auth");
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/owner/stores/${storeId}/menus/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ rows: csvRows }),
      });

      const body = await res.json();
      if (!res.ok) {
        const detail = body.details?.join("\n") ?? body.error ?? `HTTP ${res.status}`;
        throw new Error(detail);
      }

      setImportResult(`${body.imported}件のメニューをインポートしました`);
      setCsvRows(null);
      setCsvFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "インポートに失敗しました");
    } finally {
      setImporting(false);
    }
  };

  if (!store) return null;

  const CATEGORY_LABEL: Record<string, string> = {
    beer: "ビール", highball: "ハイボール", shochu: "サワー・焼酎",
    wine: "ワイン", cocktail: "カクテル", soft: "ソフトドリンク", other: "その他",
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">店舗情報の編集</h1>
        <p className="text-sm text-gray-500 mt-0.5">変更は即時 ValueSip マップに反映されます</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* 基本情報 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">基本情報</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">店舗名</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">住所</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">電話番号</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="03-0000-0000"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">席数（概算）</label>
              <input
                type="number"
                min={1}
                value={form.seats}
                onChange={(e) => handleChange("seats", e.target.value)}
                placeholder="30"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 営業時間 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">営業時間・定休日</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">営業時間</label>
            <input
              type="text"
              value={form.open_hours}
              onChange={(e) => handleChange("open_hours", e.target.value)}
              placeholder="例: 17:00〜24:00（L.O. 23:30）"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">定休日</label>
            <input
              type="text"
              value={form.closed_days}
              onChange={(e) => handleChange("closed_days", e.target.value)}
              placeholder="例: 月曜日 / 不定休 / 年中無休"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ハッピーアワー設定 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            ハッピーアワー設定
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">ハッピーアワーを有効にする</p>
              <p className="text-xs text-gray-400 mt-0.5">
                有効にすると地図ピンに「HH」バッジが表示されます
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange("hh_available", !form.hh_available)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.hh_available ? "bg-amber-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.hh_available ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {form.hh_available && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                HH 時間帯（表示テキスト）
              </label>
              <input
                type="text"
                value={form.hh_time}
                onChange={(e) => handleChange("hh_time", e.target.value)}
                placeholder="例: HH 17:00–19:00"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          )}
        </div>

        {/* ⑦ 公式認証バッジ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
            公式認証（Verified）
          </h2>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l5.59-5.59L18 8l-7 7z"/>
              </svg>
              <div>
                <p className="text-sm font-semibold text-gray-800">公式認証店舗として表示する</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  有効にするとマップ・リストに金色のバッジが表示されます
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleChange("is_verified", !form.is_verified)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                form.is_verified ? "bg-amber-400" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.is_verified ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* 位置情報（読み取り専用） */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            位置情報（マップピン）
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">緯度</p>
              <p className="text-sm font-mono text-gray-700">{store.lat.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">経度</p>
              <p className="text-sm font-mono text-gray-700">{store.lng.toFixed(6)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            ※ 位置情報の変更はサポートにお問い合わせください
          </p>
        </div>

        {/* 保存ボタン */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {saving ? "保存中…" : "変更を保存"}
          </button>

          {saved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              保存しました
            </span>
          )}

          {saveError && (
            <span className="text-sm text-red-500 font-medium">{saveError}</span>
          )}
        </div>
      </form>

      {/* ⑨ CSV メニューインポート */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              メニュー一括インポート（CSV）
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              アップロードしたメニューで現在のメニューを置き換えます
            </p>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            テンプレートDL
          </button>
        </div>

        {/* CSV カラム説明 */}
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 font-mono">
          name, category, price, hh_price, volume_ml, brand_tag
          <p className="mt-1 font-sans text-gray-400">
            category: {Object.entries(CATEGORY_LABEL).map(([k, v]) => `${k}（${v}）`).join(" / ")}
          </p>
        </div>

        {/* ファイル選択 */}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="inline-flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {csvFileName || "CSVファイルを選択…"}
          </label>
        </div>

        {/* プレビューテーブル */}
        {csvRows && csvRows.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">{csvRows.length}行を検出（プレビュー最大5件）</p>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-400 uppercase">
                  <tr>
                    {["name", "category", "price", "hh_price", "volume_ml", "brand_tag"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {csvRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="text-gray-700">
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2">{CATEGORY_LABEL[row.category] ?? row.category}</td>
                      <td className="px-3 py-2">¥{row.price}</td>
                      <td className="px-3 py-2">{row.hh_price ? `¥${row.hh_price}` : "—"}</td>
                      <td className="px-3 py-2">{row.volume_ml || "—"}</td>
                      <td className="px-3 py-2">{row.brand_tag || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvRows.length > 5 && (
              <p className="text-xs text-gray-400 mt-1.5">… 他 {csvRows.length - 5} 件</p>
            )}

            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="mt-3 bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-60"
            >
              {importing ? "インポート中…" : `${csvRows.length}件をインポート`}
            </button>
          </div>
        )}

        {importResult && (
          <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {importResult}
          </div>
        )}

        {importError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 whitespace-pre-line">
            {importError}
          </div>
        )}
      </div>
    </div>
  );
}
