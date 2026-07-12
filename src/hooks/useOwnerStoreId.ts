"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * ログイン中オーナーの store_id を owner_store_map から取得するフック。
 * 未ログイン / マッピングなしの場合は空文字を返す。
 */
export function useOwnerStoreId() {
  const [storeId, setStoreId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("owner_store_map")
        .select("store_id")
        .eq("user_id", session.user.id)
        .single();
      setStoreId(data?.store_id ?? "");
      setLoading(false);
    });
  }, []);

  return { storeId, loading };
}
