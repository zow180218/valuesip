"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/owner/update-password` }
    );

    if (authError) {
      setError("送信に失敗しました。メールアドレスを確認してください。");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-white mb-1">ValueSip</div>
          <div className="text-sm text-gray-400">パスワードリセット</div>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-xl">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">メールを送信しました</h2>
              <p className="text-sm text-gray-500 mb-6">
                パスワードリセット用のリンクを <strong>{email}</strong> 宛に送信しました。
              </p>
              <Link href="/owner/login" className="text-sm text-blue-600 hover:text-blue-500 font-semibold">
                ログイン画面に戻る
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-gray-900 mb-1">パスワードリセット</h1>
              <p className="text-xs text-gray-400 mb-6">
                登録済みのメールアドレスにリセット用リンクを送信します。
              </p>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="owner@example.com"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-60"
                >
                  {loading ? "送信中…" : "リセットメールを送信"}
                </button>
              </form>
              <p className="text-center text-xs text-gray-400 mt-5">
                <Link href="/owner/login" className="text-blue-600 hover:text-blue-500 font-semibold">
                  ログイン画面に戻る
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
