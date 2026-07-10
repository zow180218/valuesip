"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import OwnerNav from "@/components/owner/OwnerNav";
import { supabase } from "@/lib/supabase";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // ログインページはチェック不要
    if (pathname === "/owner/login") {
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/owner/login");
      } else {
        setReady(true);
      }
    });

    // ログイン状態の変化を監視（別タブでログアウトした場合など）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session && pathname !== "/owner/login") {
          router.replace("/owner/login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // ログインページはナビなし
  if (pathname === "/owner/login") {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-50">
      <OwnerNav />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
