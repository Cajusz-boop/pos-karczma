import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

/**
 * POST /api/orders/[id]/items/[itemId]/subtract - toggle subtract mode (BRAK)
 * 
 * When an item is in subtract mode:
 * - Its price becomes negative (subtracted from order total)
 * - It prints with "BRAK" prefix on kitchen printer
 * - Used for removing ingredients that would normally be included
 * 
 * Double-click functionality: first click adds item, second click makes it "BRAK"
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
      where: { id: itemId, orderId },
      include: {
        product: { select: { name: true, priceGross: true, printWithMinus: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    const currentPrice = Number(item.unitPrice);
    const isCurrentlySubtracted = currentPrice < 0;

    const originalPrice = Math.abs(currentPrice);
    const newPrice = isCurrentlySubtracted ? originalPrice : -originalPrice;

    const newNote = isCurrentlySubtracted
      ? (item.note?.replace(/^\[BRAK\]\s*/, "") || null)
      : `[BRAK] ${item.note || ""}`.trim();

    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        unitPrice: newPrice,
        note: newNote,
        isModifiedAfterSend: item.sentToKitchenAt ? true : undefined,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(
      userId,
      isCurrentlySubtracted ? "ITEM_SUBTRACT_REMOVED" : "ITEM_SUBTRACTED",
      "OrderItem",
      itemId,
      undefined,
      {
        productName: item.product.name,
        oldPrice: currentPrice,
        newPrice,
      }
    );

    return NextResponse.json({
      message: isCurrentlySubtracted
        ? `"${item.product.name}" przywrócone`
        : `"${item.product.name}" oznaczone jako BRAK`,
      isSubtracted: !isCurrentlySubtracted,
      newPrice,
    });
  } catch (e) {
    console.error("[ItemSubtract POST]", e);
    return NextResponse.json({ error: "Błąd ustawiania BRAK" }, { status: 500 });
  }
}

/**
 * DELETE /api/orders/[id]/items/[itemId]/subtract - remove subtract mode
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId, orderId },
      select: { unitPrice: true, note: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    const currentPrice = Number(item.unitPrice);
    if (currentPrice >= 0) {
      return NextResponse.json({ message: "Pozycja nie jest w trybie BRAK" });
    }

    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        unitPrice: Math.abs(currentPrice),
        note: item.note?.replace(/^\[BRAK\]\s*/, "") || null,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ITEM_SUBTRACT_REMOVED", "OrderItem", itemId);

    return NextResponse.json({ message: "Tryb BRAK usunięty" });
  } catch (e) {
    console.error("[ItemSubtract DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania BRAK" }, { status: 500 });
  }
}
