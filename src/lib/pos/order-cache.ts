import { prisma } from "@/lib/prisma";

/**
 * Przelicza i aktualizuje cache zamówienia (totalGross, itemCount, lastInteractionAt).
 * Wywołuj po każdej zmianie w OrderItem (add, update, delete, status change).
 * 
 * @param orderId - ID zamówienia do przeliczenia
 * @param tx - opcjonalny transaction client (dla użycia w $transaction)
 */
export async function recalculateOrderCache(
  orderId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx?: any
): Promise<void> {
  const client = tx ?? prisma;
  
  // Pobierz wszystkie nie-anulowane items
  const items = await client.orderItem.findMany({
    where: {
      orderId,
      status: { not: "CANCELLED" },
    },
    select: {
      quantity: true,
      unitPrice: true,
      discountAmount: true,
    },
  });
  
  // Oblicz sumę
  let totalGross = 0;
  for (const item of items) {
    const qty = Number(item.quantity);
    const price = Number(item.unitPrice);
    const discount = Number(item.discountAmount ?? 0);
    totalGross += qty * price - discount;
  }
  
  // Aktualizuj cache
  await client.order.update({
    where: { id: orderId },
    data: {
      totalGross: Math.round(totalGross * 100) / 100,
      itemCount: items.length,
      lastInteractionAt: new Date(),
    },
  });
}

/**
 * Aktualizuje tylko lastInteractionAt (dla akcji które nie zmieniają items).
 */
export async function touchOrderInteraction(
  orderId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx?: any
): Promise<void> {
  const client = tx ?? prisma;
  
  await client.order.update({
    where: { id: orderId },
    data: {
      lastInteractionAt: new Date(),
    },
  });
}
