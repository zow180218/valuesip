/**
 * お気に入り店舗ID管理（localStorage 永続化）
 */

const STORAGE_KEY = "valuesip_favorites_v1";

export function getFavoriteIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // JSON.parse は配列を返すので new Set(array) は常に安全
    return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

export function saveFavoriteIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    // Array.from を使って Set → Array に変換（スプレッド構文は downlevelIteration 必須なので回避）
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // quota exceeded etc. — ignore silently
  }
}

/**
 * 指定IDをトグルして新しい Set を返す（同時に localStorage を更新）
 */
export function toggleFavoriteId(currentIds: Set<string>, storeId: string): Set<string> {
  // new Set(iterable) でも downlevelIteration が必要な場合があるので Array.from 経由で安全に変換
  const next = new Set<string>(Array.from(currentIds));
  if (next.has(storeId)) {
    next.delete(storeId);
  } else {
    next.add(storeId);
  }
  saveFavoriteIds(next);
  return next;
}
