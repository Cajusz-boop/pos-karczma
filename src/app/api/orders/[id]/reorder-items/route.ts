import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const reorderSchema = z.object({
  itemIds: z.array(z.string()).min(1, "Lista pozycji jest wymagana"),
});

const moveItemSchema = z.object({
  itemId: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

/**
 * PUT /api/orders/[id]/reorder-items - reorder all items by provided order
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { itemIds } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
          select: { id: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    const existingIds = new Set(order.items.map((i) => i.id));
    const invalidIds = itemIds.filter((itemId) => !existingIds.has(itemId));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Nieznane pozycje: ${invalidIds.join(", ")}` },
        { status: 400 }
      );
    }

    const baseTime = new Date();
    await Promise.all(
      itemIds.map((itemId, index) =>
        prisma.orderItem.update({
          where: { id: itemId },
          data: {
            createdAt: new Date(baseTime.getTime() + index * 1000),
          },
        })
      )
    );

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_ITEMS_REORDERED", "Order", id, undefined, {
      newOrder: itemIds,
    });

    return NextResponse.json({
      message: "Kolejność pozycji zmieniona",
      itemCount: itemIds.length,
    });
  } catch (e) {
    console.error("[ReorderItems PUT]", e);
    return NextResponse.json({ error: "Błąd zmiany kolejności" }, { status: 500 });
  }
}

/**
 * PATCH /api/orders/[id]/reorder-items - move single item up/down
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = moveItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { itemId, direction } = parsed.data;

    const items = await prisma.orderItem.findMany({
      where: { orderId: id, status: { not: "CANCELLED" } },
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true },
    });

    const currentIndex = items.findIndex((i) => i.id === itemId);
    if (currentIndex === -1) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= items.length) {
      return NextResponse.json({
        message: direction === "up" ? "Pozycja jest już na górze" : "Pozycja jest już na dole",
      });
    }

    const currentItem = items[currentIndex];
    const targetItem = items[targetIndex];

    await prisma.$transaction([
      prisma.orderItem.update({
        where: { id: currentItem.id },
        data: { createdAt: targetItem.createdAt },
      }),
      prisma.orderItem.update({
        where: { id: targetItem.id },
        data: { createdAt: currentItem.createdAt },
      }),
    ]);

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_ITEM_MOVED", "OrderItem", itemId, undefined, {
      direction,
      fromIndex: currentIndex,
      toIndex: targetIndex,
    });

    return NextResponse.json({
      message: `Pozycja przesunięta ${direction === "up" ? "w górę" : "w dół"}`,
    });
  } catch (e) {
    console.error("[ReorderItems PATCH]", e);
    return NextResponse.json({ error: "Błąd przesuwania pozycji" }, { status: 500 });
  }
}
