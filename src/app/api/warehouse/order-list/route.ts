import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stockItems = await prisma.stockItem.findMany({
      where: { minQuantity: { gt: 0 } },
      include: {
        ingredient: true,
        warehouse: true,
      },
    });
    const belowMin = stockItems.filter(
      (s) => Number(s.quantity) < Number(s.minQuantity)
    );
    const list = belowMin.map((s) => ({
      stockItemId: s.id,
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      ingredientId: s.ingredientId,
      ingredientName: s.ingredient.name,
      unit: s.unit,
      quantity: Number(s.quantity),
      minQuantity: Number(s.minQuantity),
      toOrder: Math.max(0, Number(s.minQuantity) - Number(s.quantity)),
      defaultSupplier: s.ingredient.defaultSupplier,
      lastDeliveryPrice: s.lastDeliveryPrice != null ? Number(s.lastDeliveryPrice) : null,
    }));
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania listy do zamówienia" }, { status: 500 });
  }
}
