import type { Store, Menu, FilterState, StorePinData } from "@/types/store";
import { parseHHTime } from "./hhSchedule";

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
 * 全角・半角スペースで区切って検索トークン配列を返す
 * 例: "ハイボール　角" → ["ハイボール", "角"]
 */
function parseTokens(text: string): string[] {
  return text.trim().replace(/　/g, " ").toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * メニュー名・brand_tag・categoryで検索ワードにマッチするか判定
 * 複数語句はスペース区切りでAND検索（全角・半角スペース対応）
 * 例: "ハイボール　角" → "ハイボール" かつ "角" を含むメニューにマッチ
 */
export function menuMatchesSearch(menu: Menu, searchText: string): boolean {
  if (!searchText.trim()) return true;
  const tokens = parseTokens(searchText);
  const name = menu.name.toLowerCase();
  const brand = (menu.brand_tag ?? "").toLowerCase();
  const cat = menu.category.toLowerCase();
  return tokens.every((t) => name.includes(t) || brand.includes(t) || cat.includes(t));
}

/**
 * 除外ワードにマッチするか判定（OR: いずれかのトークンが一致したら除外）
 */
export function menuMatchesExclude(menu: Menu, excludeText: string): boolean {
  if (!excludeText.trim()) return false;
  const tokens = parseTokens(excludeText);
  const name = menu.name.toLowerCase();
  const brand = (menu.brand_tag ?? "").toLowerCase();
  return tokens.some((t) => name.includes(t) || brand.includes(t));
}

/**
 * 店舗に対して検索条件を適用し、ピン表示用データを返す
 *
 * 3a: 検索条件に合うメニューの最安値をピン表示
 * 2a: 全メニュー対象（検索ワードで絞る）
 *
 * @param nowMins - 現在時刻（分）。-1 の場合は isHHActive を常に false にする（SSR安全）
 */
export function computeStorePinData(
  store: Store,
  filter: FilterState,
  nowMins: number = -1,
): StorePinData | null {
  const { searchText, excludeText, minBudget, maxBudget, hhEnabled } = filter;

  // スペース区切りトークン（複数語句AND検索に使用）
  const tokens = searchText.trim().replace(/　/g, " ").toLowerCase().split(/\s+/).filter(Boolean);

  // 店舗名マッチチェック（全トークンが店舗名に含まれるか）
  const storeNameMatches = tokens.length > 0
    ? tokens.every((t) => store.name.toLowerCase().includes(t))
    : false;

  // 検索ワードに一致し、除外ワードに一致しないメニューを抽出
  const matchedMenus = store.menus.filter(
    (m) =>
      menuMatchesSearch(m, searchText) && !menuMatchesExclude(m, excludeText)
  );

  // 検索ワードあり → メニューも店舗名もマッチしない場合は非表示
  if (tokens.length > 0 && matchedMenus.length === 0 && !storeNameMatches) {
    return null;
  }

  // 実効価格リストを計算
  // 店舗名のみマッチ（メニューマッチなし）→ 全メニューを対象
  const targetMenus = tokens.length > 0 && matchedMenus.length > 0 ? matchedMenus : store.menus;
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

  // 現在時刻が HH 時間帯内かを判定（SSR安全: nowMins が -1 のときは常に false）
  const isHHActive = nowMins >= 0 && store.hh_available
    ? (() => {
        const range = parseHHTime(store.hh_time ?? "");
        return range ? nowMins >= range.startMins && nowMins < range.endMins : false;
      })()
    : false;

  return {
    store,
    effectivePrice,
    isHH,
    isHHActive,
    isInBudget,
    matchCount: matchedMenus.length,
  };
}

/**
 * 全店舗にフィルターを適用してStorePinDataのリストを返す
 * - favoriteStoreIds が渡され favoritesOnly=true の場合はお気に入りのみ
 * - 検索外の店舗はnullで除外される
 * - nowMins: 現在時刻（分）。-1 のときは isHHActive を常に false にする（SSR安全）
 */
export function filterStores(
  stores: Store[],
  filter: FilterState,
  favoriteStoreIds?: Set<string>,
  nowMins: number = -1,
): StorePinData[] {
  return stores
    .filter((s) => {
      if (filter.favoritesOnly && favoriteStoreIds) {
        return favoriteStoreIds.has(s.store_id);
      }
      return true;
    })
    .map((s) => computeStorePinData(s, filter, nowMins))
    .filter((d): d is StorePinData => d !== null);
}

/**
 * フィルターデフォルト値
 */
export const DEFAULT_FILTER: FilterState = {
  searchText: "",
  excludeText: "",
  minBudget: 0,
  maxBudget: 800,
  hhEnabled: true,
  favoritesOnly: false,
};
