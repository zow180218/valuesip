"use client";

import { useEffect } from "react";

export default function StorePageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[owner/stores/[id]] error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
      <div className="text-5xl">⚠️</div>
      <h2 className="text-lg font-bold text-gray-800">ページの読み込みに失敗しました</h2>
      <p className="text-sm text-gray-500 max-w-xs">
        接続が不安定なため、データを取得できませんでした。
        少し待ってから再試行してください。
      </p>
      <button
        onClick={reset}
        className="bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
      >
        再試行する
      </button>
    </div>
  );
}
