import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";
import { nextStockMoveNumber } from "@/lib/stock-move-number";

export const dynamic = 'force-dynamic';

type MoveItem = { ingredientId: string; quantity: number; unit: string; price?: number };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const type = searchParams.get("type");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 200);

    const where: Prisma.StockMoveWhereInput = {};
    if (warehouseId) {
      where.OR = [{ warehouseFromId: warehouseId }, { warehouseToId: warehouseId }];
    }
    if (type) {
      where.type = type as Prisma.EnumStockMoveTypeFilter["equals"];
    }

    const moves = await prisma.stockMove.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        warehouseFrom: { select: { id: true, name: true } },
        warehouseTo: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(
      moves.map((m) => ({
        id: m.id,
        type: m.type,
        documentNumber: m.documentNumber,
        warehouseFromId: m.warehouseFromId,
        warehouseFromName: m.warehouseFrom?.name,
        warehouseToId: m.warehouseToId,
        warehouseToName: m.warehouseTo?.name,
        itemsJson: m.itemsJson,
        note: m.note,
        userId: m.userId,
        createdAt: m.createdAt,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania dokumentów" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      warehouseFromId,
      warehouseToId,
      items,
      note,
      userId,
    } = body as {
      type: "PZ" | "WZ" | "RW" | "MM" | "INV";
      warehouseFromId?: string;
      warehouseToId?: string;
      items: MoveItem[];
      note?: string;
      userId?: string;
    };

    if (!type || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Typ i lista pozycji są wymagane" }, { status: 400 });
    }

    const validTypes = ["PZ", "WZ", "RW", "MM", "INV"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Nieprawidłowy typ dokumentu" }, { status: 400 });
    }

    if (type === "PZ") {
      if (!warehouseToId) return NextResponse.json({ error: "PZ wymaga magazynu docelowego" }, { status: 400 });
    } else if (type === "WZ" || type === "RW") {
      if (!warehouseFromId) return NextResponse.json({ error: "WZ/RW wymagają magazynu źródłowego" }, { status: 400 });
    } else if (type === "MM") {
      if (!warehouseFromId || !warehouseToId) return NextResponse.json({ error: "MM wymaga magazynu źródłowego i docelowego" }, { status: 400 });
      if (warehouseFromId === warehouseToId) return NextResponse.json({ error: "Magazyn źródłowy i docelowy muszą być różne" }, { status: 400 });
    }

    const docNumber = await nextStockMoveNumber(type);
    const uid = userId ?? "system";

    const itemsNormalized = items.map((i) => ({
      ingredientId: i.ingredientId,
      quantity: Number(i.quantity),
      unit: String(i.unit || "").trim() || "szt",
      price: i.price != null ? Number(i.price) : undefined,
    }));

    await prisma.$transaction(async (tx) => {
      const move = await tx.stockMove.create({
        data: {
          type,
          documentNumber: docNumber,
          warehouseFromId: warehouseFromId ?? null,
          warehouseToId: warehouseToId ?? null,
          itemsJson: itemsNormalized as unknown as object,
          note: note?.trim() ?? null,
          userId: uid,
        },
      });

      if (type === "PZ" && warehouseToId) {
        for (const it of itemsNormalized) {
          const existing = await tx.stockItem.findUnique({
            where: { warehouseId_ingredientId: { warehouseId: warehouseToId, ingredientId: it.ingredientId } },
          });
          const qty = it.quantity;
          const price = it.price;
          const unit = it.unit;
          if (existing) {
            await tx.stockItem.update({
              where: { id: existing.id },
              data: {
                quantity: { increment: qty },
                ...(price != null ? { lastDeliveryPrice: price } : {}),
              },
            });
          } else {
            await tx.stockItem.create({
              data: {
                warehouseId: warehouseToId,
                ingredientId: it.ingredientId,
                quantity: qty,
                unit,
                lastDeliveryPrice: price ?? null,
              },
            });
          }
        }
      } else if ((type === "WZ" || type === "RW") && warehouseFromId) {
        for (const it of itemsNormalized) {
          const row = await tx.stockItem.findUnique({
            where: { warehouseId_ingredientId: { warehouseId: warehouseFromId, ingredientId: it.ingredientId } },
          });
          if (!row) throw new Error(`Brak składnika ${it.ingredientId} w magazynie źródłowym`);
          const newQty = Number(row.quantity) - it.quantity;
          await tx.stockItem.update({
            where: { id: row.id },
            data: { quantity: Math.max(0, newQty) },
          });
        }
      } else if (type === "MM" && warehouseFromId && warehouseToId) {
        for (const it of itemsNormalized) {
          const fromRow = await tx.stockItem.findUnique({
            where: { warehouseId_ingredientId: { warehouseId: warehouseFromId, ingredientId: it.ingredientId } },
          });
          if (!fromRow) throw new Error(`Brak składnika w magazynie źródłowym`);
          const newFromQty = Math.max(0, Number(fromRow.quantity) - it.quantity);
          await tx.stockItem.update({
            where: { id: fromRow.id },
            data: { quantity: newFromQty },
          });
          const toRow = await tx.stockItem.findUnique({
            where: { warehouseId_ingredientId: { warehouseId: warehouseToId, ingredientId: it.ingredientId } },
          });
          if (toRow) {
            await tx.stockItem.update({
              where: { id: toRow.id },
              data: { quantity: { increment: it.quantity } },
            });
          } else {
            await tx.stockItem.create({
              data: {
                warehouseId: warehouseToId,
                ingredientId: it.ingredientId,
                quantity: it.quantity,
                unit: fromRow.unit,
                lastDeliveryPrice: fromRow.lastDeliveryPrice,
              },
            });
          }
        }
      }
      return move;
    });

    return NextResponse.json({ ok: true, documentNumber: docNumber });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd tworzenia dokumentu" },
      { status: 500 }
    );
  }
}
