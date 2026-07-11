/**
 * お気に入り店舗ID管理（localStorage 永続化）
 */

const STORAGE_KEY = "valuesip_favorites_v1";

export function getFavoriteIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveFavoriteIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // quota exceeded etc. — ignore silently
  }
}

/**
 * 指定IDをトグルして新しい Set を返す（同時に localStorage を更新）
 */
export function toggleFavoriteId(currentIds: Set<string>, storeId: string): Set<string> {
  const next = new Set(currentIds);
  if (next.has(storeId)) {
    next.delete(storeId);
  } else {
    next.add(storeId);
  }
  saveFavoriteIds(next);
  return next;
}
