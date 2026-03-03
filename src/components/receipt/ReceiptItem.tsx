"use client";

type Item = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  paidQuantity: number;
  lockedQuantity: number;
  availableQuantity: number;
  lineTotal: number;
  status: string;
};

type T = {
  paid: string;
  locked: string;
};

export function ReceiptItem({ item, t }: { item: Item; t: T }) {
  const isPaid = item.paidQuantity >= item.quantity;
  const isLocked = item.lockedQuantity > 0 && !isPaid;

  return (
    <tr
      className={`border-b border-stone-200 ${
        isPaid ? "text-stone-400 line-through" : ""
      }`}
    >
      <td className="py-2 pr-2" aria-label={isPaid ? t.paid : isLocked ? t.locked : undefined}>
        <span className="flex items-center gap-1">
          {isPaid && (
            <span aria-hidden="true" title={t.paid}>
              ✓
            </span>
          )}
          {isLocked && (
            <span aria-hidden="true" title={t.locked}>
              🔒
            </span>
          )}
          <span>{item.name}</span>
        </span>
      </td>
      <td className="text-right py-2 tabular-nums">
        {item.quantity}
        {item.availableQuantity > 0 && item.availableQuantity < item.quantity && (
          <span className="text-stone-500 text-xs ml-0.5">
            ({item.availableQuantity} do zapłaty)
          </span>
        )}
      </td>
      <td className="text-right py-2 tabular-nums font-medium">
        {new Intl.NumberFormat("pl-PL", {
          style: "currency",
          currency: "PLN",
          minimumFractionDigits: 2,
        }).format(item.lineTotal)}
      </td>
    </tr>
  );
}
