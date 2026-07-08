"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// デモ用認証情報
const DEMO_EMAIL = "owner@valuesip.jp";
const DEMO_PASSWORD = "demo1234";
const DEMO_STORE_NAME = "道玄坂ビアホール";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    // デモ認証（本番ではSupabase Auth / API呼び出しに置き換え）
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem("ownerToken", "demo-token-" + Date.now());
      localStorage.setItem("ownerStoreName", DEMO_STORE_NAME);
      router.push("/owner/dashboard");
    } else {
      setError(
        "メールアドレスまたはパスワードが正しくありません。\nデモ: " +
          DEMO_EMAIL +
          " / " +
          DEMO_PASSWORD
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-white mb-1">ValueSip</div>
          <div className="text-sm text-gray-400">オーナーポータル</div>
        </div>

        {/* ログインカード */}
        <div className="bg-white rounded-2xl p-7 shadow-xl">
          <h1 className="text-lg font-bold text-gray-900 mb-6">ログイン</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="owner@valuesip.jp"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 whitespace-pre-line">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {loading ? "ログイン中…" : "ログイン"}
            </button>
          </form>

          {/* デモ情報 */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">デモアカウント</p>
            <p className="text-xs text-gray-500 text-center mt-1">
              {DEMO_EMAIL} / {DEMO_PASSWORD}
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mt-5">
          ValueSip — 飲食コスパマップ オーナー管理画面
        </p>
      </div>
    </div>
  );
}
