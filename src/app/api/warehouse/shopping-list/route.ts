export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stockItems = await prisma.stockItem.findMany({
      where: {
        quantity: { lt: prisma.stockItem.fields.minQuantity },
      },
      include: {
        ingredient: true,
      },
    });

    const list = stockItems.map((s) => {
      const currentQty = Number(s.quantity);
      const minQty = Number(s.minQuantity);
      const toOrder = Math.max(0, minQty - currentQty);
      return {
        ingredientId: s.ingredientId,
        ingredientName: s.ingredient.name,
        unit: s.unit,
        currentQty,
        minQty,
        toOrder,
      };
    });

    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd generowania listy zakupów" },
      { status: 500 }
    );
  }
}
