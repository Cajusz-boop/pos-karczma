import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { sendPushToRole } from "@/lib/push/web-push";

/**
 * POST /api/orders/[id]/items/[itemId]/fire - mark item as FIRE (immediate priority)
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [ {"id":"_","itemId":"_"} ];
}


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: { select: { orderNumber: true, tableId: true } },
        product: { select: { name: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    if (item.orderId !== orderId) {
      return NextResponse.json({ error: "Pozycja nie należy do tego zamówienia" }, { status: 400 });
    }

    if (item.status === "READY" || item.status === "SERVED" || item.status === "CANCELLED") {
      return NextResponse.json({ error: "Nie można wywołać 'Ogień' dla tej pozycji" }, { status: 400 });
    }

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        isFire: true,
        firedAt: new Date(),
        delayMinutes: null,
        fireAt: null,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_ITEM_FIRE", "OrderItem", itemId, undefined, {
      orderId,
      productName: item.product.name,
    });

    sendPushToRole("ADMIN", {
      title: "🔥 OGIEŃ!",
      body: `#${item.order.orderNumber} - ${item.product.name}`,
      data: { type: "FIRE", orderId, itemId },
    }).catch(console.error);

    return NextResponse.json({
      item: {
        id: updated.id,
        isFire: updated.isFire,
        firedAt: updated.firedAt?.toISOString(),
      },
    });
  } catch (e) {
    console.error("[Fire POST]", e);
    return NextResponse.json({ error: "Błąd ustawienia 'Ogień'" }, { status: 500 });
  }
}

/**
 * DELETE /api/orders/[id]/items/[itemId]/fire - remove FIRE flag
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.orderId !== orderId) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        isFire: false,
        firedAt: null,
      },
    });

    return NextResponse.json({
      item: {
        id: updated.id,
        isFire: updated.isFire,
      },
    });
  } catch (e) {
    console.error("[Fire DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania 'Ogień'" }, { status: 500 });
  }
}
