export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endOfDay } from "date-fns";


/** GET /api/reports/warehouse?date= â€” raport magazynowy (stany per magazyn, wartoĹ›Ä‡, straty RW) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const date = dateStr ? new Date(dateStr) : new Date();
    const to = endOfDay(date);

    const stockItems = await prisma.stockItem.findMany({
      include: {
        warehouse: { select: { id: true, name: true, type: true } },
        ingredient: { select: { id: true, name: true, unit: true } },
      },
    });

    const moves = await prisma.stockMove.findMany({
      where: { type: "RW", createdAt: { lte: to } },
      select: { itemsJson: true, note: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const byWarehouse: Record<string, { name: string; type: string; items: { ingredient: string; quantity: number; unit: string; minQuantity: number }[]; totalValue: number }> = {};
    for (const s of stockItems) {
      const wid = s.warehouseId;
      if (!byWarehouse[wid]) {
        byWarehouse[wid] = { name: s.warehouse.name, type: s.warehouse.type, items: [], totalValue: 0 };
      }
      const qty = Number(s.quantity);
      const lastPrice = Number(s.lastDeliveryPrice ?? 0);
      byWarehouse[wid].items.push({
        ingredient: s.ingredient.name,
        quantity: qty,
        unit: s.unit,
        minQuantity: Number(s.minQuantity),
      });
      byWarehouse[wid].totalValue += qty * lastPrice;
    }

    const losses = moves.slice(0, 50).map((m) => ({
      date: (m.createdAt as Date).toISOString().slice(0, 10),
      note: m.note ?? "",
      items: m.itemsJson,
    }));

    return NextResponse.json({
      date: date.toISOString().slice(0, 10),
      warehouses: Object.entries(byWarehouse).map(([id, v]) => ({
        id,
        name: v.name,
        type: v.type,
        itemCount: v.items.length,
        totalValue: Math.round(v.totalValue * 100) / 100,
        items: v.items,
      })),
      lossesCount: moves.length,
      losses,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d raportu magazynowego" }, { status: 500 });
  }
}
