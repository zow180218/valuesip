import type { Store, Menu, FilterState, StorePinData } from "@/types/store";

// ──────────────────────────────────────────────
// 価格計算ロジック
// price-definition.md (1a/2a/3a/4c) に準拠
// ──────────────────────────────────────────────

/**
 * 1件のメニューの実効価格（HHトグル状態に応じて）を返す
 * 4c: HHトグルON = HH価格優先、OFF = 通常価格
 */
export function effectiveMenuPrice(menu: Menu, hhEnabled: boolean): number {
  if (hhEnabled && menu.hh_price !== undefined) {
    return menu.hh_price;
  }
  return menu.price;
}

/**
 * メニュー名・brand_tag・categoryで検索ワードにマッチするか判定
 * 大文字小文字を無視、ひらがな・カタカナは区別あり
 */
export function menuMatchesSearch(menu: Menu, searchText: string): boolean {
  if (!searchText.trim()) return true;
  const q = searchText.toLowerCase();
  return (
    menu.name.toLowerCase().includes(q) ||
    (menu.brand_tag?.toLowerCase().includes(q) ?? false) ||
    menu.category.toLowerCase().includes(q)
  );
}

/**
 * 除外ワードにマッチするか判定
 */
export function menuMatchesExclude(menu: Menu, excludeText: string): boolean {
  if (!excludeText.trim()) return false;
  const q = excludeText.toLowerCase();
  return (
    menu.name.toLowerCase().includes(q) ||
    (menu.brand_tag?.toLowerCase().includes(q) ?? false)
  );
}

/**
 * 店舗に対して検索条件を適用し、ピン表示用データを返す
 *
 * 3a: 検索条件に合うメニューの最安値をピン表示
 * 2a: 全メニュー対象（検索ワードで絞る）
 */
export function computeStorePinData(
  store: Store,
  filter: FilterState
): StorePinData | null {
  const { searchText, excludeText, minBudget, maxBudget, hhEnabled } = filter;

  const q = searchText.trim().toLowerCase();

  // 店舗名マッチチェック
  const storeNameMatches = q ? store.name.toLowerCase().includes(q) : false;

  // 検索ワードに一致し、除外ワードに一致しないメニューを抽出
  const matchedMenus = store.menus.filter(
    (m) =>
      menuMatchesSearch(m, searchText) && !menuMatchesExclude(m, excludeText)
  );

  // 検索ワードあり → メニューも店舗名もマッチしない場合は非表示
  if (q && matchedMenus.length === 0 && !storeNameMatches) {
    return null;
  }

  // 実効価格リストを計算
  // 店舗名のみマッチ（メニューマッチなし）→ 全メニューを対象
  const targetMenus = q && matchedMenus.length > 0 ? matchedMenus : store.menus;
  const prices = targetMenus.map((m) => effectiveMenuPrice(m, hhEnabled));

  if (prices.length === 0) return null;

  const effectivePrice = Math.min(...prices);
  const cheapestMenu = targetMenus[prices.indexOf(effectivePrice)];
  const isHH =
    hhEnabled &&
    cheapestMenu.hh_price !== undefined &&
    cheapestMenu.hh_price === effectivePrice;

  const isInBudget =
    effectivePrice >= minBudget && effectivePrice <= maxBudget;

  return {
    store,
    effectivePrice,
    isHH,
    isInBudget,
    matchCount: matchedMenus.length,
  };
}

/**
 * 全店舗にフィルターを適用してStorePinDataのリストを返す
 * 検索外の店舗はnullで除外される
 */
export function filterStores(
  stores: Store[],
  filter: FilterState
): StorePinData[] {
  return stores
    .map((s) => computeStorePinData(s, filter))
    .filter((d): d is StorePinData => d !== null);
}

/**
 * 予算デフォルト値
 */
export const DEFAULT_FILTER: FilterState = {
  searchText: "",
  excludeText: "",
  minBudget: 0,
  maxBudget: 800,
  hhEnabled: true,
};
