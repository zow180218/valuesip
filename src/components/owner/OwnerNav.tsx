"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// デモ用固定店舗ID（本番では owner_store_map から取得）
const DEMO_STORE_ID = "shib-001";

const navItems = [
  { label: "ダッシュボード", href: "/owner/dashboard" },
  { label: "店舗情報", href: `/owner/stores/${DEMO_STORE_ID}/edit` },
  { label: "メニュー管理", href: `/owner/stores/${DEMO_STORE_ID}/menu` },
  { label: "クーポン", href: "/owner/coupons" },
  { label: "POS連携", href: "/owner/pos" },
  { label: "分析", href: "/owner/analytics" },
  { label: "価格報告", href: "/owner/admin/reports" },
];

export default function OwnerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? "");
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/owner/login");
  };

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-30">
      {/* トップバー */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div>
          <div className="text-sm font-bold tracking-tight">ValueSip Owner</div>
          <div className="text-xs text-gray-400 mt-0.5">{userEmail || "オーナーポータル"}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-green-500 text-white px-2.5 py-0.5 rounded-full font-semibold">
            ● 公開中
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* ナビゲーションリンク */}
      <nav className="flex overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/owner/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-shrink-0 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "text-white border-blue-400"
                  : "text-gray-400 border-transparent hover:text-gray-200"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
