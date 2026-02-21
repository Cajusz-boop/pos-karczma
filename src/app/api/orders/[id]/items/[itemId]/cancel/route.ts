import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { recalculateOrderCache } from "@/lib/pos/order-cache";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason, reasonCode } = body as { reason?: string; reasonCode?: string };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }
    if (order.status === "CLOSED") {
      return NextResponse.json({ error: "Zamówienie zamknięte" }, { status: 400 });
    }

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }
    if (item.status === "CANCELLED") {
      return NextResponse.json({ error: "Pozycja już anulowana" }, { status: 400 });
    }

    const cancelReason = [reasonCode || "other", reason].filter(Boolean).join(": ") || "Anulowano";
    const now = new Date();

    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelReason: cancelReason.slice(0, 255),
      },
    });

    // Przelicz cache po anulowaniu pozycji
    await recalculateOrderCache(orderId);

    await auditLog(null, "ORDER_ITEM_CANCELLED", "OrderItem", itemId, { status: item.status }, { status: "CANCELLED", reason: cancelReason });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd anulowania pozycji" }, { status: 500 });
  }
}
