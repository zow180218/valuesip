"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SAMPLE_STORES } from "@/data/stores";
import type { Menu, MenuCategory } from "@/types/store";

const CATEGORY_LABELS: Record<string, string> = {
  beer: "ビール",
  highball: "ハイボール",
  shochu: "サワー・焼酎",
  wine: "ワイン",
  cocktail: "カクテル",
  soft: "ソフトドリンク",
  other: "その他",
};
const CATEGORY_ORDER = ["beer", "highball", "shochu", "wine", "cocktail", "other", "soft"];
const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as MenuCategory[];

let nextId = 1000;

export default function MenuManagementPage() {
  const params = useParams();
  const storeId = params?.id as string;

  const [menus, setMenus] = useState<Menu[]>([]);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Menu>>({});
  const [hhTime, setHhTime] = useState<string>("HH 17:00–19:00");
  const [syncing, setSyncing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<Partial<Menu>>({ category: "beer" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const store = SAMPLE_STORES.find((s) => s.store_id === storeId) ?? SAMPLE_STORES[0];
    setMenus([...store.menus]);
    setHhTime(store.hh_time ?? "HH 17:00–19:00");
  }, [storeId]);

  const filtered = menus
    .filter((m) => filterCat === "all" || m.category === filterCat)
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  // 編集開始
  const startEdit = (menu: Menu) => {
    setEditingId(menu.id);
    setEditForm({ ...menu });
  };

  // 編集保存
  const saveEdit = () => {
    if (!editingId) return;
    setMenus((prev) =>
      prev.map((m) => (m.id === editingId ? { ...m, ...editForm } as Menu : m))
    );
    setEditingId(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 削除
  const deleteMenu = (id: string) => {
    if (!confirm("このメニューを削除しますか？")) return;
    setMenus((prev) => prev.filter((m) => m.id !== id));
  };

  // 追加
  const handleAdd = () => {
    if (!addForm.name || !addForm.price || !addForm.category) return;
    const newMenu: Menu = {
      id: String(nextId++),
      name: addForm.name!,
      category: addForm.category as MenuCategory,
      price: Number(addForm.price),
      hh_price: addForm.hh_price ? Number(addForm.hh_price) : undefined,
      brand_tag: addForm.brand_tag,
      volume_ml: addForm.volume_ml ? Number(addForm.volume_ml) : undefined,
    };
    setMenus((prev) => [...prev, newMenu]);
    setAddForm({ category: "beer" });
    setShowAdd(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // POS同期（デモ）
  const handlePosSync = async () => {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 1800));
    setSyncing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">メニュー管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">{menus.length} 件掲載中</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={handlePosSync}
            disabled={syncing}
            className="flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-60"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? "同期中…" : "POS から同期"}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            メニュー追加
          </button>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 font-semibold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          変更を保存しました
        </div>
      )}

      {/* HH設定 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-lg">🍻</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-amber-900">ハッピーアワー時間帯</p>
          <input
            type="text"
            value={hhTime}
            onChange={(e) => setHhTime(e.target.value)}
            className="mt-1 text-sm text-amber-800 font-semibold bg-transparent border-b border-amber-300 focus:outline-none w-48"
          />
        </div>
        <p className="text-xs text-amber-700">HH価格が設定されたメニューはこの時間帯にHH価格で表示されます</p>
      </div>

      {/* カテゴリフィルター */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ key: "all", label: "すべて" }, ...ALL_CATEGORIES.map((c) => ({ key: c, label: CATEGORY_LABELS[c] }))].map(
          ({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterCat(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filterCat === key
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* メニュー一覧 */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_90px_80px] px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
          <div>品名</div>
          <div>通常価格</div>
          <div>HH価格</div>
          <div>ステータス</div>
          <div>操作</div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-400">
            該当するメニューがありません
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {filtered.map((menu) => (
            <div key={menu.id}>
              {editingId === menu.id ? (
                /* 編集行 */
                <div className="px-4 py-3 bg-blue-50 border-l-2 border-blue-400 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 font-semibold">品名</label>
                      <input
                        type="text"
                        value={editForm.name ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm mt-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-semibold">カテゴリ</label>
                      <select
                        value={editForm.category ?? "beer"}
                        onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value as MenuCategory }))}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm mt-0.5 focus:outline-none"
                      >
                        {ALL_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 font-semibold">通常価格 (¥)</label>
                      <input
                        type="number"
                        min={0}
                        value={editForm.price ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm mt-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-semibold">HH価格 (¥)</label>
                      <input
                        type="number"
                        min={0}
                        value={editForm.hh_price ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, hh_price: e.target.value ? Number(e.target.value) : undefined }))}
                        placeholder="未設定"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm mt-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-semibold">容量 (ml)</label>
                      <input
                        type="number"
                        min={0}
                        value={editForm.volume_ml ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, volume_ml: e.target.value ? Number(e.target.value) : undefined }))}
                        placeholder="省略可"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm mt-0.5 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold">ブランド名（省略可）</label>
                    <input
                      type="text"
                      value={editForm.brand_tag ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, brand_tag: e.target.value || undefined }))}
                      placeholder="例: サッポロ"
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm mt-0.5 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdit} className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg">保存</button>
                    <button onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg">キャンセル</button>
                  </div>
                </div>
              ) : (
                /* 表示行 */
                <div className="grid grid-cols-[1fr_80px_80px_90px_80px] items-center px-4 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{menu.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {CATEGORY_LABELS[menu.category] ?? menu.category}
                      </span>
                      {menu.brand_tag && <span className="text-[10px] text-gray-400">{menu.brand_tag}</span>}
                      {menu.volume_ml && <span className="text-[10px] text-gray-400">{menu.volume_ml}ml</span>}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-800">¥{menu.price.toLocaleString()}</div>
                  <div className={`text-sm font-bold ${menu.hh_price ? "text-amber-500" : "text-gray-300"}`}>
                    {menu.hh_price ? `¥${menu.hh_price.toLocaleString()}` : "—"}
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      menu.id.startsWith("1") ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"
                    }`}>
                      {menu.id.startsWith("1") ? "POS同期" : "手動"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(menu)}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => deleteMenu(menu.id)}
                      className="text-[11px] text-red-400 hover:underline font-semibold"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* メニュー追加フォーム */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900">新しいメニューを追加</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 font-semibold">品名 *</label>
              <input
                type="text"
                value={addForm.name ?? ""}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例: 黒ビール"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-semibold">カテゴリ *</label>
              <select
                value={addForm.category ?? "beer"}
                onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value as MenuCategory }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none"
              >
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-semibold">通常価格 (¥) *</label>
              <input
                type="number"
                min={0}
                value={addForm.price ?? ""}
                onChange={(e) => setAddForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-semibold">HH価格 (¥)</label>
              <input
                type="number"
                min={0}
                value={addForm.hh_price ?? ""}
                onChange={(e) => setAddForm((f) => ({ ...f, hh_price: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="省略可"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-semibold">ブランド名</label>
              <input
                type="text"
                value={addForm.brand_tag ?? ""}
                onChange={(e) => setAddForm((f) => ({ ...f, brand_tag: e.target.value || undefined }))}
                placeholder="例: サッポロ"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-semibold">容量 (ml)</label>
              <input
                type="number"
                min={0}
                value={addForm.volume_ml ?? ""}
                onChange={(e) => setAddForm((f) => ({ ...f, volume_ml: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="省略可"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-0.5 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!addForm.name || !addForm.price}
              className="bg-gray-900 text-white text-xs font-bold px-5 py-2 rounded-lg disabled:opacity-50"
            >
              追加
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="bg-gray-100 text-gray-600 text-xs font-semibold px-4 py-2 rounded-lg"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
