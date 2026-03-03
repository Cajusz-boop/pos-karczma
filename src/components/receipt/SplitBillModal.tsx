"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/translations";

type Item = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  availableQuantity: number;
  lineTotal: number;
};

export function SplitBillModal({
  items,
  totalRemaining,
  onClose,
  onConfirm,
  locale,
}: {
  items: Item[];
  totalRemaining: number;
  onClose: () => void;
  onConfirm: (selected: Array<{ orderItemId: string; quantity: number }>) => void;
  locale: Locale;
}) {
  const [mode, setMode] = useState<"self" | "equal">("self");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [splitCount, setSplitCount] = useState(2);

  const availableItems = items.filter((i) => i.availableQuantity > 0);

  const toggleItem = (item: Item, qty: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[item.id];
      } else {
        next[item.id] = Math.min(qty, item.availableQuantity);
      }
      return next;
    });
  };

  const confirmSelf = () => {
    const list = Object.entries(selected)
      .filter(([, q]) => q > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (list.length > 0) onConfirm(list);
    else onClose();
  };

  const confirmEqual = () => {
    if (splitCount < 2) return;
    const perPerson = totalRemaining / splitCount;
    const firstAmount = Math.round(perPerson * 100) / 100;
    const firstQty = splitCount - 1;
    let allocated = 0;
    const result: Array<{ orderItemId: string; quantity: number }> = [];
    for (const item of availableItems) {
      const itemTotal = item.unitPrice * item.availableQuantity;
      if (allocated + itemTotal <= firstAmount * firstQty) {
        result.push({ orderItemId: item.id, quantity: item.availableQuantity });
        allocated += itemTotal;
      } else {
        const remaining = firstAmount * firstQty - allocated;
        if (remaining > 0 && item.unitPrice > 0) {
          const partialQty = Math.min(item.availableQuantity, remaining / item.unitPrice);
          if (partialQty > 0) {
            result.push({ orderItemId: item.id, quantity: partialQty });
          }
        }
        break;
      }
    }
    if (result.length > 0) onConfirm(result);
    else onClose();
  };

  const t = locale === "pl"
    ? { splitBill: "Podziel rachunek", payForSelf: "Płacę za siebie", splitEqual: "Podziel równo", people: "Na ile osób?", confirm: "Zapłać", cancel: "Anuluj" }
    : { splitBill: "Split the bill", payForSelf: "Pay for myself", splitEqual: "Split equally", people: "How many people?", confirm: "Pay", cancel: "Cancel" };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="split-bill-title">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[80vh] overflow-y-auto p-4">
        <h2 id="split-bill-title" className="text-lg font-semibold mb-4">{t.splitBill}</h2>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("self")}
            className={`flex-1 py-2 rounded-xl font-medium ${
              mode === "self" ? "bg-amber-700 text-white" : "bg-stone-200"
            }`}
          >
            {t.payForSelf}
          </button>
          <button
            type="button"
            onClick={() => setMode("equal")}
            className={`flex-1 py-2 rounded-xl font-medium ${
              mode === "equal" ? "bg-amber-700 text-white" : "bg-stone-200"
            }`}
          >
            {t.splitEqual}
          </button>
        </div>

        {mode === "self" && (
          <div className="space-y-2 mb-4">
            {availableItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <span className="text-sm flex-1 truncate">{item.name}</span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() =>
                        toggleItem(item, n === (selected[item.id] ?? 0) ? 0 : n)
                      }
                      aria-label={`${item.name} — ${n} szt.`}
                      aria-pressed={(selected[item.id] ?? 0) >= n}
                      className={`min-h-[44px] min-w-[44px] rounded-lg font-medium ${
                        (selected[item.id] ?? 0) >= n
                          ? "bg-amber-700 text-white"
                          : "bg-stone-200"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  {item.availableQuantity > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        toggleItem(
                          item,
                          (selected[item.id] ?? 0) === item.availableQuantity
                            ? 0
                            : item.availableQuantity
                        )
                      }
                      aria-label={`${item.name} — ${item.availableQuantity} szt.`}
                      aria-pressed={(selected[item.id] ?? 0) === item.availableQuantity}
                      className={`min-h-[44px] min-w-[44px] rounded-lg font-medium ${
                        (selected[item.id] ?? 0) === item.availableQuantity
                          ? "bg-amber-700 text-white"
                          : "bg-stone-200"
                      }`}
                    >
                      {item.availableQuantity}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {mode === "equal" && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{t.people}</label>
            <input
              type="number"
              min={2}
              max={20}
              value={splitCount}
              onChange={(e) => setSplitCount(Math.max(2, parseInt(e.target.value, 10) || 2))}
              className="w-full min-h-[44px] px-4 rounded-xl border border-stone-300"
            />
            <p className="text-sm text-stone-500 mt-2">
              ~{new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(totalRemaining / splitCount)} na osobę
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-stone-200 font-medium min-h-[44px]"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={mode === "self" ? confirmSelf : confirmEqual}
            className="flex-1 py-3 rounded-xl bg-amber-700 text-white font-medium min-h-[44px]"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
