"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function OwnerSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("パスワードは8文字以上で設定してください。");
      return;
    }
    if (password !== passwordConfirm) {
      setError("パスワードが一致しません。");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/owner/dashboard`,
      },
    });

    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "このメールアドレスはすでに登録されています。"
          : "登録に失敗しました。メールアドレスを確認してください。"
      );
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-white mb-1">ValueSip</div>
          <div className="text-sm text-gray-400">オーナーポータル — 新規登録</div>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-xl">
          {done ? (
            /* 送信完了 */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">確認メールを送信しました</h2>
              <p className="text-sm text-gray-500 mb-6">
                <strong>{email}</strong> 宛に確認メールを送信しました。
                メール内のリンクをクリックして登録を完了してください。
              </p>
              <Link
                href="/owner/login"
                className="text-sm text-blue-600 hover:text-blue-500 font-semibold"
              >
                ログイン画面に戻る
              </Link>
            </div>
          ) : (
            /* 登録フォーム */
            <>
              <h1 className="text-lg font-bold text-gray-900 mb-1">新規登録</h1>
              <p className="text-xs text-gray-400 mb-6">
                招待メールを受け取ったメールアドレスで登録してください。
              </p>

              <form onSubmit={handleSignup} className="space-y-4">
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

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    パスワード（8文字以上）
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    パスワード（確認）
                  </label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    placeholder="••••••••"
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
                  {loading ? "登録中…" : "登録する"}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-5">
                すでにアカウントをお持ちの方は{" "}
                <Link href="/owner/login" className="text-blue-600 hover:text-blue-500 font-semibold">
                  ログイン
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
