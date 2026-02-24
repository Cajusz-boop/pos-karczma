import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

/**
 * POST /api/orders/[id]/copy - copy order (resend to kitchen)
 * 
 * Creates a new order with same items and resends to kitchen printers.
 * Used for reprinting or creating duplicate orders.
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const originalOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
          include: {
            product: { select: { id: true, name: true } },
            taxRate: { select: { id: true } },
          },
        },
        table: { select: { id: true, number: true } },
      },
    });

    if (!originalOrder) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    const lastOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    const nextOrderNumber = (lastOrder?.orderNumber ?? 0) + 1;

    const userId = request.headers.get("x-user-id") ?? originalOrder.userId;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber: nextOrderNumber,
        tableId: originalOrder.tableId,
        roomId: originalOrder.roomId,
        userId: userId,
        customerId: originalOrder.customerId,
        status: "OPEN",
        type: originalOrder.type,
        guestCount: originalOrder.guestCount,
        banquetEventId: originalOrder.banquetEventId,
        note: originalOrder.note ? `[KOPIA] ${originalOrder.note}` : "[KOPIA]",
        deliveryPhone: originalOrder.deliveryPhone,
        deliveryAddress: originalOrder.deliveryAddress,
        deliveryNote: originalOrder.deliveryNote,
        deliveryZoneId: originalOrder.deliveryZoneId,
        copiedFromId: originalOrder.id,
        items: {
          create: originalOrder.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRateId: item.taxRateId,
            discountAmount: item.discountAmount,
            modifiersJson: item.modifiersJson as Prisma.InputJsonValue,
            note: item.note,
            courseNumber: item.courseNumber,
            status: "ORDERED",
            isBanquetExtra: item.isBanquetExtra,
            isTakeaway: item.isTakeaway,
            requiresWeightConfirm: item.requiresWeightConfirm,
            parentItemId: item.parentItemId,
            isSetComponent: item.isSetComponent,
            componentPriceDelta: item.componentPriceDelta,
            removedComponentsJson: item.removedComponentsJson as Prisma.InputJsonValue,
            addedComponentsJson: item.addedComponentsJson as Prisma.InputJsonValue,
            noteType: item.noteType,
            isRush: item.isRush,
            isPriority: item.isPriority,
            printBold: item.printBold,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
        table: { select: { number: true } },
      },
    });

    await auditLog(userId, "ORDER_COPIED", "Order", newOrder.id, undefined, {
      originalOrderId: originalOrder.id,
      originalOrderNumber: originalOrder.orderNumber,
      itemCount: newOrder.items.length,
    });

    return NextResponse.json({
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        tableNumber: newOrder.table?.number,
        itemCount: newOrder.items.length,
        copiedFromId: newOrder.copiedFromId,
      },
      message: `Zamówienie #${originalOrder.orderNumber} skopiowane jako #${newOrder.orderNumber}`,
    }, { status: 201 });
  } catch (e) {
    console.error("[OrderCopy POST]", e);
    return NextResponse.json({ error: "Błąd kopiowania zamówienia" }, { status: 500 });
  }
}
