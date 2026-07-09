"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// /owner/register
//
// 招待リンクをクリックしたオーナーがアカウントを完成させる画面。
// URL hash に Supabase access_token が含まれている。
//
// フロー:
//   1. URL hash からトークンを取り出してセッションを確立
//   2. パスワード設定フォームを表示
//   3. 設定完了後 /owner/dashboard にリダイレクト
// ─────────────────────────────────────────────────────────────

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("store_id");

  const [step, setStep] = useState<"loading" | "form" | "done" | "error">("loading");
  const [storeName, setStoreName] = useState<string>("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // URL hash からトークンを取得（Supabase が #access_token=... 形式で付与）
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || type !== "invite") {
      // 開発環境: トークンなしでも画面は確認できる
      setStep("form");
      return;
    }

    // Supabase クライアントでセッションを確立
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setStep("form"); // ローカル開発
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken ?? "" })
      .then(({ data, error: sessionError }) => {
        if (sessionError || !data.session) {
          setError("招待リンクが無効か期限切れです");
          setStep("error");
        } else {
          // ユーザーメタデータから店舗名を取得
          const meta = data.session.user?.user_metadata ?? {};
          setStoreName(meta.store_name ?? storeId ?? "");
          setStep("form");
        }
      });
  }, [storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で設定してください");
      return;
    }
    setSubmitting(true);
    setError("");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // ローカル開発モード
      setStep("done");
      setTimeout(() => router.push("/owner/dashboard"), 2000);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { display_name: displayName.trim() || undefined },
    });

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    setStep("done");
    setTimeout(() => router.push("/owner/dashboard"), 2000);
  };

  // ── ローディング ───────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">招待リンクを確認中…</p>
        </div>
      </div>
    );
  }

  // ── エラー ────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl border border-red-100 p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-base font-bold text-gray-900 mb-2">招待リンクが無効です</h1>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <p className="text-xs text-gray-400">
            管理者に再招待を依頼してください。
          </p>
        </div>
      </div>
    );
  }

  // ── 完了 ────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-base font-bold text-gray-900 mb-2">登録完了！</h1>
          <p className="text-sm text-gray-500">
            ダッシュボードに移動します…
          </p>
        </div>
      </div>
    );
  }

  // ── 登録フォーム ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-sm w-full">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🍺</div>
          <h1 className="text-lg font-bold text-gray-900">ValueSip オーナー登録</h1>
          {storeName && (
            <p className="text-sm text-gray-500 mt-1">
              担当店舗: <span className="font-semibold text-gray-700">{storeName}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600">
              表示名（任意）
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例: 田中 太郎"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">
              パスワード <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8文字以上"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">
              パスワード（確認）<span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              placeholder="もう一度入力"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !password || !passwordConfirm}
            className="w-full bg-gray-900 text-white text-sm font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {submitting ? "登録中…" : "登録を完了する"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
