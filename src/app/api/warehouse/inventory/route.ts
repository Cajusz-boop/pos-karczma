import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextStockMoveNumber } from "@/lib/stock-move-number";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { warehouseId, counts, userId } = body as {
      warehouseId: string;
      counts: Array<{ stockItemId: string; ingredientId: string; countedQuantity: number; unit: string }>;
      userId?: string;
    };

    if (!warehouseId || !Array.isArray(counts) || counts.length === 0) {
      return NextResponse.json({ error: "Magazyn i lista spisu są wymagane" }, { status: 400 });
    }

    const docNumber = await nextStockMoveNumber("INV");
    const uid = userId ?? "system";

    const itemsJson: Array<{ ingredientId: string; systemQty: number; countedQty: number; unit: string; difference: number }> = [];
    await prisma.$transaction(async (tx) => {
      for (const c of counts) {
        const row = await tx.stockItem.findFirst({
          where: { id: c.stockItemId, warehouseId },
          include: { ingredient: true },
        });
        if (!row) continue;
        const systemQty = Number(row.quantity);
        const countedQty = Math.max(0, Number(c.countedQuantity));
        const diff = countedQty - systemQty;
        itemsJson.push({
          ingredientId: row.ingredientId,
          systemQty,
          countedQty,
          unit: row.unit,
          difference: diff,
        });
        await tx.stockItem.update({
          where: { id: row.id },
          data: { quantity: countedQty },
        });
      }
      await tx.stockMove.create({
        data: {
          type: "INV",
          documentNumber: docNumber,
          warehouseFromId: warehouseId,
          warehouseToId: null,
          itemsJson: itemsJson as unknown as object,
          note: `Inwentaryzacja ${new Date().toISOString().slice(0, 10)}`,
          userId: uid,
        },
      });
    });

    return NextResponse.json({ ok: true, documentNumber: docNumber, items: itemsJson });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd inwentaryzacji" }, { status: 500 });
  }
}
