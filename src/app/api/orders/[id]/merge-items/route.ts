import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

type ModifierJson = { modifierId: string; name: string; priceDelta: number };

/**
 * POST /api/orders/[id]/merge-items - merge similar items in order
 * 
 * Combines identical items (same product, modifiers, note, course, price)
 * into single lines with summed quantities.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          where: {
            status: { notIn: ["CANCELLED", "SERVED"] },
            isSetComponent: false,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    const generateKey = (item: typeof order.items[0]): string => {
      const modifiers = (item.modifiersJson as ModifierJson[] | null) ?? [];
      const modifierKey = modifiers
        .map((m) => `${m.modifierId}:${m.priceDelta}`)
        .sort()
        .join("|");
      
      return [
        item.productId,
        item.unitPrice.toString(),
        item.courseNumber,
        item.note ?? "",
        modifierKey,
        item.isTakeaway ? "T" : "D",
        item.noteType ?? "",
      ].join(":");
    };

    const groups = new Map<string, typeof order.items>();
    for (const item of order.items) {
      const key = generateKey(item);
      const existing = groups.get(key);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(key, [item]);
      }
    }

    let mergedCount = 0;
    const deletedIds: string[] = [];

    for (const items of Array.from(groups.values())) {
      if (items.length < 2) continue;

      const [first, ...rest] = items;
      const totalQuantity = items.reduce((sum, i) => sum.add(i.quantity), new Prisma.Decimal(0));

      await prisma.orderItem.update({
        where: { id: first.id },
        data: { quantity: totalQuantity },
      });

      for (const item of rest) {
        deletedIds.push(item.id);
        await prisma.orderItem.delete({ where: { id: item.id } });
      }

      mergedCount += rest.length;
    }

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_ITEMS_MERGED", "Order", id, undefined, {
      mergedCount,
      deletedIds,
    });

    return NextResponse.json({
      message: mergedCount > 0
        ? `Połączono ${mergedCount} pozycji`
        : "Brak pozycji do połączenia",
      mergedCount,
      remainingItems: order.items.length - mergedCount,
    });
  } catch (e) {
    console.error("[MergeItems POST]", e);
    return NextResponse.json({ error: "Błąd łączenia pozycji" }, { status: 500 });
  }
}
