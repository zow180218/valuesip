"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import OwnerNav from "@/components/owner/OwnerNav";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("ownerToken");
    if (!token && pathname !== "/owner/login") {
      router.replace("/owner/login");
    } else {
      setReady(true);
    }
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
