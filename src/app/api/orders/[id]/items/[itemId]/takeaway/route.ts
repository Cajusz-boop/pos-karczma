import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

/**
 * POST /api/orders/[id]/items/[itemId]/takeaway - mark item as takeaway
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
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
      where: { id: itemId, orderId },
      select: { id: true, sentToKitchenAt: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        isTakeaway: true,
        isModifiedAfterSend: item.sentToKitchenAt ? true : undefined,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_ITEM_MARKED_TAKEAWAY", "OrderItem", itemId);

    return NextResponse.json({ message: "Pozycja oznaczona jako na wynos" });
  } catch (e) {
    console.error("[ItemTakeaway POST]", e);
    return NextResponse.json({ error: "Błąd ustawiania na wynos" }, { status: 500 });
  }
}

/**
 * DELETE /api/orders/[id]/items/[itemId]/takeaway - unmark item as takeaway
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId, orderId },
      select: { id: true, sentToKitchenAt: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        isTakeaway: false,
        isModifiedAfterSend: item.sentToKitchenAt ? true : undefined,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_ITEM_UNMARKED_TAKEAWAY", "OrderItem", itemId);

    return NextResponse.json({ message: "Pozycja nie jest już na wynos" });
  } catch (e) {
    console.error("[ItemTakeaway DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania oznaczenia na wynos" }, { status: 500 });
  }
}
