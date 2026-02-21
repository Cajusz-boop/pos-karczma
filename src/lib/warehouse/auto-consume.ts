import { prisma } from "@/lib/prisma";
import { nextStockMoveNumber } from "@/lib/stock-move-number";

export async function consumeStockForOrder(orderId: string, userId: string = "system"): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        where: { status: { not: "CANCELLED" } },
        include: { product: { include: { recipe: { include: { items: { include: { ingredient: true } } } } } } },
      },
    },
  });
  if (!order) return;
  const toConsume: Array<{ ingredientId: string; quantity: number; unit: string }> = [];
  for (const oi of order.items) {
    const recipe = oi.product.recipe;
    if (!recipe) continue;
    const qtySold = Number(oi.quantity);
    const yieldQty = Number(recipe.yieldQty) || 1;
    const factor = qtySold / yieldQty;
    for (const ri of recipe.items) {
      const need = Number(ri.quantity) * factor;
      const unit = ri.unit ?? "szt";
      const existing = toConsume.find((t) => t.ingredientId === ri.ingredientId && t.unit === unit);
      if (existing) existing.quantity += need;
      else toConsume.push({ ingredientId: ri.ingredientId, quantity: need, unit });
    }
  }
  if (toConsume.length === 0) return;

  const warehouseOrder = ["KITCHEN", "MAIN", "BAR", "COLD_STORAGE"] as const;
  const warehouses = await prisma.warehouse.findMany({
    where: { type: { in: [...warehouseOrder] } },
    orderBy: [{ type: "asc" }],
  });
  const byType = Object.fromEntries(warehouses.map((w) => [w.type, w.id]));

  const docNumber = await nextStockMoveNumber("RW");
  const moveItems: Array<{ ingredientId: string; quantity: number; unit: string }> = [];

  await prisma.$transaction(async (tx) => {
    for (const it of toConsume) {
      let remaining = it.quantity;
      for (const wType of warehouseOrder) {
        const wid = byType[wType];
        if (!wid || remaining <= 0) continue;
        const stock = await tx.stockItem.findFirst({
          where: { warehouseId: wid, ingredientId: it.ingredientId },
        });
        if (!stock) continue;
        const avail = Number(stock.quantity);
        if (avail <= 0) continue;
        const deduct = Math.min(remaining, avail);
        await tx.stockItem.update({
          where: { id: stock.id },
          data: { quantity: { decrement: deduct } },
        });
        moveItems.push({ ingredientId: it.ingredientId, quantity: deduct, unit: stock.unit });
        remaining -= deduct;
      }
    }
    if (moveItems.length > 0) {
      await tx.stockMove.create({
        data: {
          type: "RW",
          documentNumber: docNumber,
          warehouseFromId: warehouses[0]?.id ?? null,
          warehouseToId: null,
          itemsJson: moveItems as unknown as object,
          note: `Auto rozchód po sprzedaży — zamówienie ${order.orderNumber}`,
          userId,
        },
      });
    }
  });
}
