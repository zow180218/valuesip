"use client";

import { useState, useEffect } from "react";
import type { StoreCoupon } from "@/types/store";
import { useOwnerStoreId } from "@/hooks/useOwnerStoreId";

export default function OwnerCouponsPage() {
  const { storeId, loading: storeLoading } = useOwnerStoreId();
  const [coupons, setCoupons] = useState<StoreCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  // 新規作成フォーム
  const [form, setForm] = useState({
    title: "",
    discount_text: "",
    description: "",
    valid_until: "",
  });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // クーポン一覧取得
  const fetchCoupons = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/coupons?store_id=${storeId}`);
      const data = await res.json();
      setCoupons(data.coupons ?? []);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!storeLoading) fetchCoupons();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, storeLoading]);

  // 作成
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.discount_text) return;
    setCreating(true);
    setCreateMsg(null);
    try {
      const res = await fetch("/api/owner/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          title: form.title,
          discount_text: form.discount_text,
          description: form.description || undefined,
          valid_until: form.valid_until || null,
        }),
      });
      if (!res.ok) throw new Error();
      setCreateMsg({ ok: true, text: "クーポンを作成しました" });
      setForm({ title: "", discount_text: "", description: "", valid_until: "" });
      setShowForm(false);
      await fetchCoupons();
    } catch {
      setCreateMsg({ ok: false, text: "作成に失敗しました" });
    } finally {
      setCreating(false);
    }
  };

  // 有効/無効トグル
  const handleToggle = async (coupon: StoreCoupon) => {
    try {
      await fetch(`/api/owner/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      });
      await fetchCoupons();
    } catch {}
  };

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm("このクーポンを削除しますか？")) return;
    try {
      await fetch(`/api/owner/coupons/${id}`, { method: "DELETE" });
      await fetchCoupons();
    } catch {}
  };

  const active = coupons.filter((c) => c.is_active);
  const inactive = coupons.filter((c) => !c.is_active);

  return (
    <div className="space-y-5 max-w-2xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">クーポン管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            作成したクーポンはユーザーの店舗詳細画面に表示されます
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          クーポンを作成
        </button>
      </div>

      {createMsg && (
        <div className={`rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 ${
          createMsg.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {createMsg.ok ? "✅" : "⚠️"} {createMsg.text}
        </div>
      )}

      {/* 作成フォーム */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-blue-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">新しいクーポン</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">タイトル *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="例: 期間限定！生ビール特別価格"
              required
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">割引内容 *</label>
            <input
              type="text"
              value={form.discount_text}
              onChange={(e) => setForm((f) => ({ ...f, discount_text: e.target.value }))}
              placeholder="例: 生ビール ¥300（通常¥600）"
              required
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">説明（任意）</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="例: 17:00〜19:00の間にご来店の方限定"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">有効期限（任意）</label>
            <input
              type="datetime-local"
              value={form.valid_until}
              onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-[11px] text-gray-400 mt-1">空欄の場合は無期限で表示されます</p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={creating || !form.title || !form.discount_text}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {creating ? "作成中…" : "作成する"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-semibold"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* 有効クーポン */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          有効中 ({active.length})
        </h2>

        {loading ? (
          <div className="text-sm text-gray-400 py-4 text-center">読み込み中…</div>
        ) : active.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-sm text-gray-400">有効なクーポンはありません</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-xs text-brand-600 font-semibold hover:underline"
            >
              最初のクーポンを作成する →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((c) => (
              <CouponCard key={c.id} coupon={c} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* 無効クーポン */}
      {inactive.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            停止中 ({inactive.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {inactive.map((c) => (
              <CouponCard key={c.id} coupon={c} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CouponCard({
  coupon,
  onToggle,
  onDelete,
}: {
  coupon: StoreCoupon;
  onToggle: (c: StoreCoupon) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4">
      {/* クーポンアイコン */}
      <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">{coupon.title}</p>
        <p className="text-sm font-black text-red-500 mt-0.5">{coupon.discount_text}</p>
        {coupon.description && (
          <p className="text-xs text-gray-400 mt-0.5">{coupon.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {coupon.valid_until ? (
            <span className="text-[11px] text-gray-400">
              〜{new Date(coupon.valid_until).toLocaleDateString("ja-JP")} まで
            </span>
          ) : (
            <span className="text-[11px] text-gray-400">無期限</span>
          )}
          <span className="text-[11px] text-gray-300">
            作成: {new Date(coupon.created_at).toLocaleDateString("ja-JP")}
          </span>
        </div>
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onToggle(coupon)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            coupon.is_active ? "bg-green-400" : "bg-gray-200"
          }`}
          title={coupon.is_active ? "停止する" : "有効にする"}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              coupon.is_active ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
        <button
          onClick={() => onDelete(coupon.id)}
          className="text-gray-300 hover:text-red-400 transition-colors"
          title="削除"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
