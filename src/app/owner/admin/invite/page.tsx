"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StoreOption {
  store_id: string;
  name: string;
}

// ─────────────────────────────────────────────────────────────
// /owner/admin/invite
//
// 管理者が店舗オーナーへ招待メールを送る画面
// POST /api/admin/invite を呼び出す
// ─────────────────────────────────────────────────────────────
export default function InvitePage() {
  const [email, setEmail] = useState("");
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // 利用可能な店舗一覧を取得
  useEffect(() => {
    fetch("/api/stores?area=shibuya")
      .then((r) => r.json())
      .then((data) => {
        if (data.stores) {
          setStores(
            data.stores.map((s: { store_id: string; name: string }) => ({
              store_id: s.store_id,
              name: s.name,
            }))
          );
          if (data.stores.length > 0) setStoreId(data.stores[0].store_id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !storeId) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, store_id: storeId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(
          data._dev
            ? `（開発モード）${email} に招待メールを送信しました（DBスキップ）`
            : `${email} に招待メールを送信しました。店舗: ${data.store_name}`
        );
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "送信に失敗しました");
      }
    } catch {
      setStatus("error");
      setMessage("ネットワークエラーが発生しました");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">オーナー招待</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          招待メールを送信すると、オーナーは専用リンクからアカウント登録できます
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600">
              招待するオーナーのメールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="owner@example.com"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">担当店舗</label>
            {stores.length > 0 ? (
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                required
                className="mt-1 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
              >
                {stores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>
                    {s.name}（{s.store_id}）
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  required
                  placeholder="例: shib-001"
                  className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none"
                />
                <span className="text-xs text-gray-400">store_id を直接入力</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={status === "loading" || !email || !storeId}
            className="w-full bg-gray-900 text-white text-sm font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "送信中…" : "招待メールを送る"}
          </button>
        </form>

        {/* ステータスメッセージ */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-sm font-medium ${
              status === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {status === "success" ? "✅ " : "❌ "}
            {message}
          </div>
        )}
      </div>

      {/* 招待フロー説明 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-3">招待フロー</h2>
        <ol className="space-y-2.5 text-sm text-gray-600">
          {[
            "このページで店舗オーナーのメールアドレスを入力して送信",
            "オーナーに招待メールが届く（Supabase Auth）",
            "オーナーがメール内のリンクをクリック",
            "/owner/register でパスワード設定・店舗確認",
            "/owner/dashboard でオーナーポータルにアクセス開始",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex justify-start">
        <Link href="/owner/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
          ← ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
