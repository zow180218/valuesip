"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ReportWithMenu } from "@/app/api/admin/reports/route";

// ─────────────────────────────────────────────────────────────
// /owner/admin/reports
//
// pending 状態の価格報告一覧を表示し、
// 承認（→ メニュー価格を更新）または却下ができる管理画面
// ─────────────────────────────────────────────────────────────

type ActionState =
  | "idle"
  | "approving"
  | "rejecting"
  | "done-approve"
  | "done-reject"
  | "error";

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportWithMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, ActionState>>({});

  const fetchReports = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "取得に失敗しました");
      setReports(data.reports ?? []);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (
    reportId: string,
    action: "approve" | "reject"
  ) => {
    setActionState((prev) => ({
      ...prev,
      [reportId]: action === "approve" ? "approving" : "rejecting",
    }));

    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        setActionState((prev) => ({ ...prev, [reportId]: "error" }));
        return;
      }

      setActionState((prev) => ({
        ...prev,
        [reportId]: action === "approve" ? "done-approve" : "done-reject",
      }));

      // 処理完了後にリストから削除
      setTimeout(() => {
        setReports((prev) =>
          prev.filter((r) => r.report_id !== reportId)
        );
      }, 900);
    } catch {
      setActionState((prev) => ({ ...prev, [reportId]: "error" }));
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">価格報告レビュー</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            ユーザーから寄せられた価格修正申請を確認・承認します
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          🔄 再読込
        </button>
      </div>

      {/* ローディング */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          <span className="animate-pulse">読み込み中…</span>
        </div>
      )}

      {/* エラー */}
      {!loading && fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          ❌ {fetchError}
        </div>
      )}

      {/* 報告なし */}
      {!loading && !fetchError && reports.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-sm font-semibold text-gray-700">
            未処理の価格報告はありません
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ユーザーから新しい報告が届くとここに表示されます
          </p>
        </div>
      )}

      {/* 報告一覧 */}
      {!loading && !fetchError && reports.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-medium">
            {reports.length} 件の未処理報告
          </p>

          {reports.map((report) => {
            const state = actionState[report.report_id] ?? "idle";
            const isProcessing =
              state === "approving" || state === "rejecting";
            const isDoneApprove = state === "done-approve";
            const isDoneReject = state === "done-reject";
            const isDone = isDoneApprove || isDoneReject;
            const menu = report.menus;
            const priceDiff = menu
              ? report.reported_price - menu.price
              : null;

            return (
              <div
                key={report.report_id}
                className={`bg-white rounded-2xl border transition-all duration-300 ${
                  isDoneApprove
                    ? "border-green-200 bg-green-50 opacity-75"
                    : isDoneReject
                    ? "border-gray-200 opacity-50"
                    : state === "error"
                    ? "border-red-200"
                    : "border-gray-100"
                }`}
              >
                <div className="p-5">
                  {/* ヘッダー */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {menu?.name ?? "不明なメニュー"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">
                        {menu?.store_id ?? "?"} /{" "}
                        {report.report_id.slice(0, 8)}…
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      {formatDate(report.created_at)}
                    </span>
                  </div>

                  {/* 価格比較 */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        現在の価格
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        ¥{(menu?.price ?? 0).toLocaleString()}
                      </p>
                      {menu?.hh_price != null && (
                        <p className="text-xs text-amber-600 font-semibold">
                          HH ¥{menu.hh_price.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">
                        報告された価格
                      </p>
                      <p className="text-lg font-bold text-blue-800">
                        ¥{report.reported_price.toLocaleString()}
                      </p>
                      {report.reported_hh_price != null && (
                        <p className="text-xs text-blue-600 font-semibold">
                          HH ¥{report.reported_hh_price.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 差額バッジ */}
                  {priceDiff !== null && priceDiff !== 0 && (
                    <div className="mb-3">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          priceDiff > 0
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {priceDiff > 0 ? "▲" : "▼"} ¥
                        {Math.abs(priceDiff).toLocaleString()} の差
                      </span>
                    </div>
                  )}

                  {/* ユーザーコメント */}
                  {report.note && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
                      <p className="text-xs text-amber-800">
                        💬 {report.note}
                      </p>
                    </div>
                  )}

                  {/* アクションボタン / ステータス表示 */}
                  {isDone ? (
                    <div
                      className={`text-center text-sm font-semibold py-2 ${
                        isDoneApprove ? "text-green-700" : "text-gray-400"
                      }`}
                    >
                      {isDoneApprove
                        ? "✅ 承認しました — 価格を更新しました"
                        : "❌ 却下しました"}
                    </div>
                  ) : state === "error" ? (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-red-600 font-medium">
                        エラーが発生しました
                      </p>
                      <button
                        onClick={() =>
                          setActionState((prev) => ({
                            ...prev,
                            [report.report_id]: "idle",
                          }))
                        }
                        className="text-xs text-gray-500 underline"
                      >
                        再試行
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleAction(report.report_id, "approve")
                        }
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {state === "approving"
                          ? "処理中…"
                          : "✅ 承認して価格を更新"}
                      </button>
                      <button
                        onClick={() =>
                          handleAction(report.report_id, "reject")
                        }
                        disabled={isProcessing}
                        className="flex-1 bg-gray-100 text-gray-700 text-sm font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {state === "rejecting" ? "処理中…" : "❌ 却下"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-start">
        <Link
          href="/owner/dashboard"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
