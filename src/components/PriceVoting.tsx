"use client";

import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// デバイスフィンガープリント（匿名投票用）
// localStorage に永続化する簡易識別子
// ─────────────────────────────────────────────────────────────
function getFingerprint(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "vs_fp";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const fp = crypto.randomUUID();
  localStorage.setItem(key, fp);
  return fp;
}

// ─────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────
interface VoteStats {
  ok_count: number;
  ng_count: number;
  total: number;
  accuracy_pct: number | null;
  recent_reports: Array<{
    reported_price: number;
    reported_hh_price: number | null;
    note: string | null;
    created_at: string;
  }>;
}

interface PriceVotingProps {
  /** DB の menu_id (UUID) */
  menuId: string;
  menuName: string;
}

// ─────────────────────────────────────────────────────────────
// PriceVoting コンポーネント
//
// - 👍/👎 で価格の正確さに投票
// - 「価格を報告する」フォームを開いて新しい価格を送信
// - 投票・報告は匿名（localStorage fingerprint）
// ─────────────────────────────────────────────────────────────
export default function PriceVoting({ menuId, menuName }: PriceVotingProps) {
  // サンプルデータIDや非UUID IDはスキップ
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(menuId);

  const [stats, setStats] = useState<VoteStats | null>(null);
  const [myVote, setMyVote] = useState<boolean | null>(null); // null=未投票
  const [voting, setVoting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportPrice, setReportPrice] = useState("");
  const [reportHhPrice, setReportHhPrice] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!isValidUuid) return;
    try {
      const res = await fetch(`/api/votes?menu_id=${menuId}`);
      if (res.ok) {
        const data: VoteStats = await res.json();
        setStats(data);
      }
    } catch {
      // ネットワーク失敗時は無視
    }
  }, [menuId, isValidUuid]);

  useEffect(() => {
    fetchStats();
    // 前回の投票を復元
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`vs_vote_${menuId}`);
      if (saved !== null) setMyVote(saved === "ok");
    }
  }, [menuId, fetchStats]);

  const handleVote = async (isAccurate: boolean) => {
    if (voting || !isValidUuid) return;
    setVoting(true);
    setMyVote(isAccurate);
    // ローカルに保存（ページリロード後も維持）
    localStorage.setItem(`vs_vote_${menuId}`, isAccurate ? "ok" : "ng");

    try {
      await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu_id: menuId,
          is_accurate: isAccurate,
          fingerprint: getFingerprint(),
        }),
      });
      await fetchStats();
    } catch {
      // 失敗しても UI は維持
    } finally {
      setVoting(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseInt(reportPrice, 10);
    if (!price || price <= 0) return;
    setReporting(true);

    try {
      await fetch("/api/price-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu_id: menuId,
          reported_price: price,
          reported_hh_price: reportHhPrice ? parseInt(reportHhPrice, 10) : null,
          note: reportNote || undefined,
          fingerprint: getFingerprint(),
        }),
      });
      setReportSent(true);
      setShowReport(false);
      setReportPrice("");
      setReportHhPrice("");
      setReportNote("");
      setTimeout(() => setReportSent(false), 3000);
    } catch {
      // 失敗時は無視
    } finally {
      setReporting(false);
    }
  };

  // UUID でない（サンプルデータ）場合は非表示
  if (!isValidUuid) return null;

  const pct = stats?.accuracy_pct ?? 0;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {/* 投票セクション */}
      <p className="text-[11px] text-gray-400 mb-2">この価格は正確ですか？</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleVote(true)}
          disabled={voting}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            myVote === true
              ? "bg-green-100 border-green-400 text-green-800"
              : "bg-white border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50"
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          正確 {stats ? stats.ok_count : ""}
        </button>

        <button
          onClick={() => handleVote(false)}
          disabled={voting}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            myVote === false
              ? "bg-red-50 border-red-300 text-red-700"
              : "bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50"
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
          違う {stats ? stats.ng_count : ""}
        </button>

        {stats && stats.total > 0 && (
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="ml-auto text-[10px] text-gray-400 hover:text-gray-600"
          >
            {stats.total}人が投票
          </button>
        )}
      </div>

      {/* 正確率バー */}
      {stats && stats.total > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400">{pct}%</span>
        </div>
      )}

      {/* 報告送信完了メッセージ */}
      {reportSent && (
        <p className="text-[11px] text-green-600 font-semibold mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          報告を送信しました。ありがとうございます！
        </p>
      )}

      {/* 価格報告トリガー */}
      {!showReport && !reportSent && (
        <button
          onClick={() => setShowReport(true)}
          className="mt-2 text-[11px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          価格を報告する
        </button>
      )}

      {/* 価格報告フォーム */}
      {showReport && (
        <form
          onSubmit={handleReport}
          className="mt-3 bg-gray-50 rounded-xl p-3 space-y-2.5"
        >
          <p className="text-[11px] font-semibold text-gray-700">
            価格を報告 — {menuName}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500">現在の価格（税込）</label>
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  type="number"
                  min={1}
                  max={99999}
                  value={reportPrice}
                  onChange={(e) => setReportPrice(e.target.value)}
                  placeholder="例: 680"
                  required
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
                <span className="text-xs text-gray-400">円</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500">HH価格（任意）</label>
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  type="number"
                  min={1}
                  max={99999}
                  value={reportHhPrice}
                  onChange={(e) => setReportHhPrice(e.target.value)}
                  placeholder="省略可"
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <span className="text-xs text-gray-400">円</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500">メモ（任意）</label>
            <input
              type="text"
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              placeholder="例: 7月から値上がりしました"
              maxLength={200}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mt-0.5 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={reporting || !reportPrice}
              className="flex-1 bg-brand-500 text-white text-xs font-bold py-2 rounded-lg disabled:opacity-50"
            >
              {reporting ? "送信中…" : "報告を送る"}
            </button>
            <button
              type="button"
              onClick={() => { setShowReport(false); setReportPrice(""); setReportHhPrice(""); setReportNote(""); }}
              className="px-3 bg-white border border-gray-200 text-gray-500 text-xs font-semibold rounded-lg"
            >
              閉じる
            </button>
          </div>
        </form>
      )}

      {/* 投票履歴（pendingの価格報告） */}
      {showHistory && stats && stats.recent_reports.length > 0 && (
        <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-2">
          <p className="text-[11px] font-semibold text-gray-600">最近の価格報告</p>
          {stats.recent_reports.map((r, i) => (
            <div key={i} className="text-[11px] text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span>
                ¥{r.reported_price.toLocaleString()}
                {r.reported_hh_price && (
                  <span className="text-amber-500"> / HH ¥{r.reported_hh_price.toLocaleString()}</span>
                )}
                {r.note && <span className="text-gray-400"> — {r.note}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
