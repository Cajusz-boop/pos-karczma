export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sync/open-orders
 * Returns all open orders with items for Dexie sync.
 * Used to populate local DB on POS page load.
 */
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
      include: {
        table: { select: { id: true, number: true } },
        room: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        items: {
          where: { status: { not: "CANCELLED" } },
          include: {
            product: { select: { name: true, nameShort: true } },
            taxRate: { select: { id: true, ratePercent: true, fiscalSymbol: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date().toISOString();

    const transformedOrders = orders.map((o) => {
      const itemsTotal = o.items.reduce((sum, i) => {
        const modTotal = ((i.modifiersJson as Array<{ priceDelta: number }>) ?? []).reduce((s, m) => s + m.priceDelta, 0);
        return sum + Number(i.quantity) * (Number(i.unitPrice) + modTotal) - Number(i.discountAmount);
      }, 0);

      return {
        _serverId: o.id,
        _localId: `server-${o.id}`,
        _syncStatus: "synced" as const,
        _localVersion: 1,
        _updatedAt: now,
        orderNumber: o.orderNumber,
        tableId: o.tableId ?? undefined,
        roomId: o.roomId ?? undefined,
        userId: o.userId,
        userName: o.user.name,
        status: o.status as "OPEN" | "SENT_TO_KITCHEN" | "IN_PROGRESS" | "READY" | "SERVED" | "BILL_REQUESTED",
        type: (o.type ?? "DINE_IN") as "DINE_IN" | "TAKEAWAY" | "BANQUET" | "PHONE" | "DELIVERY" | "HOTEL_ROOM",
        guestCount: o.guestCount,
        note: o.note ?? undefined,
        discountJson: o.discountJson as { type: "PERCENT" | "AMOUNT"; value: number; reason?: string } | undefined,
        createdAt: o.createdAt.toISOString(),
        closedAt: o.closedAt?.toISOString(),
        totalGross: Math.round(itemsTotal * 100) / 100,
        itemCount: o.items.reduce((sum, i) => sum + Number(i.quantity), 0),
        tableNumber: o.table?.number,
        roomName: o.room?.name,
      };
    });

    const transformedItems = orders.flatMap((o) =>
      o.items.map((i) => ({
        _serverId: i.id,
        _localId: `server-${i.id}`,
        _syncStatus: "synced" as const,
        _localVersion: 1,
        _updatedAt: now,
        orderId: `server-${o.id}`,
        orderServerId: o.id,
        productId: i.productId,
        productName: i.product.name,
        productNameShort: i.product.nameShort ?? undefined,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        taxRateId: i.taxRateId,
        taxRatePercent: Number(i.taxRate.ratePercent),
        fiscalSymbol: i.taxRate.fiscalSymbol,
        discountAmount: Number(i.discountAmount),
        modifiersJson: i.modifiersJson as Array<{ modifierId: string; name: string; priceDelta: number }> | undefined,
        note: i.note ?? undefined,
        courseNumber: i.courseNumber,
        status: i.status as "ORDERED" | "SENT" | "IN_PROGRESS" | "READY" | "SERVED",
        sentToKitchenAt: i.sentToKitchenAt?.toISOString(),
        readyAt: i.readyAt?.toISOString(),
        servedAt: i.servedAt?.toISOString(),
        isTakeaway: i.isTakeaway ?? false,
      }))
    );

    return NextResponse.json({
      orders: transformedOrders,
      items: transformedItems,
      serverTimestamp: now,
    });
  } catch (e) {
    console.error("[SyncOpenOrders] Error:", e);
    return NextResponse.json({ error: "Failed to fetch open orders" }, { status: 500 });
  }
}
