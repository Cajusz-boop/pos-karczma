"use client";

import { translations } from "@/lib/i18n/translations";
import { ReceiptItem } from "./ReceiptItem";

type Item = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRatePercent: number;
  fiscalSymbol: string;
  discountAmount: number;
  modifiers: string | null;
  note: string | null;
  paidQuantity: number;
  lockedQuantity: number;
  availableQuantity: number;
  lineTotal: number;
  status: string;
};

export function OrderSummary({
  items,
  locale,
}: {
  items: Item[];
  locale: "pl" | "en";
}) {
  const t = translations[locale];

  return (
    <section aria-label={locale === "pl" ? "Lista pozycji rachunku" : "Order items"} aria-live="polite" aria-atomic="true">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-stone-300">
            <th className="text-left py-2 font-medium text-stone-700">Pozycja</th>
            <th className="text-right py-2 font-medium text-stone-700">Ilość</th>
            <th className="text-right py-2 font-medium text-stone-700">Wartość</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ReceiptItem key={item.id} item={item} t={t} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
