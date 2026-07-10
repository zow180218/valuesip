/**
 * クライアントサイド認証ヘルパー
 * Supabase セッションの JWT を API リクエストに付与するために使用
 */
import { supabase } from "./supabase";

/**
 * 現在の Supabase セッションから Authorization ヘッダーを取得する。
 * 未ログインの場合は空オブジェクトを返す（API 側で 401 になる）。
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return {
    "Authorization": `Bearer ${session.access_token}`,
  };
}
