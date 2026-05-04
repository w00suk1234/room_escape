"use client";

import { inventoryItems } from "@/data/chapter1";
import type { ItemId } from "@/types/game";

interface InventoryBarProps {
  items: ItemId[];
  onInspectItem: (itemId: ItemId) => void;
}

const memoItems: ItemId[] = ["torn_memo_a", "serin_warning_note", "torn_photo_fragment"];

export function InventoryBar({ items, onInspectItem }: InventoryBarProps) {
  return (
    <footer className="glass-panel px-4 py-3">
      <div className={items.length === 0 ? "flex items-center justify-between" : "mb-3 flex items-center justify-between"}>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Inventory</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{items.length} secured</p>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((itemId, index) => (
            <button
              key={itemId}
              className={`min-h-14 min-w-36 border px-3 py-2 text-left transition hover:-translate-y-0.5 hover:border-cyanline ${
                memoItems.includes(itemId)
                  ? "border-cyanline/35 bg-cyan-950/20 text-cyan-50"
                  : "border-slate-600/60 bg-slate-950/65 text-slate-100"
              }`}
              onClick={() => onInspectItem(itemId)}
            >
              <span className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">clue {index + 1}</span>
              <span className="mt-1 block text-sm font-bold">{inventoryItems[itemId].name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-slate-700/70 bg-slate-950/30 px-4 py-4 text-sm text-slate-500">
          아직 확보한 단서가 없다.
        </div>
      )}
    </footer>
  );
}
