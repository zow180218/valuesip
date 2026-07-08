"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SAMPLE_STORES } from "@/data/stores";
import type { Store } from "@/types/store";

export default function StoreEditPage() {
  const params = useParams();
  const storeId = params?.id as string;

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
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
    });
  }, [storeId]);

  const handleChange = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setSaveError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    try {
      const res = await fetch(`/api/owner/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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

  if (!store) return null;

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
            <p className="text-xs text-gray-400 mt-1.5">店舗詳細ページの「基本情報」に表示されます</p>
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
              <p className="text-xs text-gray-400 mt-1.5">
                マップのバッジとHHバナーにそのまま表示されます
              </p>
            </div>
          )}
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
            <span className="text-sm text-red-500 font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {saveError}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
