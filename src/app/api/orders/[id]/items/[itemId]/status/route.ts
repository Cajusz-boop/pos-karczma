export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push/web-push";
import { touchOrderInteraction } from "@/lib/pos/order-cache";

const VALID_STATUSES = ["IN_PROGRESS", "READY", "SERVED"] as const;
type ValidStatus = typeof VALID_STATUSES[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;
    const body = await request.json();
    const { status } = body as { status: ValidStatus };
    const userId = request.headers.get("x-user-id");

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Nieprawidłowy status" }, { status: 400 });
    }

    const item = await prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
      include: { order: true },
    });
    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }
    if (item.status === "CANCELLED") {
      return NextResponse.json({ error: "Pozycja anulowana" }, { status: 400 });
    }

    const now = new Date();

    // Validate transitions
    if (status === "IN_PROGRESS") {
      if (item.status !== "SENT" && item.status !== "IN_PROGRESS") {
        return NextResponse.json({ error: "Nie można zmienić statusu na Zaczynam" }, { status: 400 });
      }
      await prisma.orderItem.update({
        where: { id: itemId },
        data: { status: "IN_PROGRESS", startedAt: now, preparedByUserId: userId ?? undefined },
      });
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "IN_PROGRESS" },
      });
    } else if (status === "READY") {
      if (item.status !== "SENT" && item.status !== "IN_PROGRESS") {
        return NextResponse.json({ error: "Nie można zmienić statusu na Gotowe" }, { status: 400 });
      }
      await prisma.orderItem.update({
        where: { id: itemId },
        data: {
          status: "READY",
          readyAt: now,
          preparedByUserId: userId ?? item.preparedByUserId ?? undefined,
        },
      });
      // Check if all items are ready
      const allItems = await prisma.orderItem.findMany({
        where: { orderId, status: { not: "CANCELLED" } },
      });
      const sentItems = allItems.filter((i) => ["SENT", "IN_PROGRESS", "READY", "SERVED"].includes(i.status));
      const allReady = sentItems.length > 0 && sentItems.every((i) => i.status === "READY" || i.status === "SERVED");
      if (allReady) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "READY" },
        });
        // Send push notification to the waiter
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { userId: true, orderNumber: true, table: { select: { number: true } } },
        });
        if (order) {
          const tableInfo = order.table ? `Stolik ${order.table.number}` : `Zamówienie #${order.orderNumber}`;
          sendPushToUser(order.userId, {
            title: "Dania gotowe!",
            body: `${tableInfo} — wszystkie dania gotowe do odbioru`,
            icon: "/icon-192.png",
            data: { orderId, type: "ORDER_READY" },
          }).catch(() => {});
        }
      }
    } else if (status === "SERVED") {
      if (item.status !== "READY") {
        return NextResponse.json({ error: "Pozycja musi być gotowa przed podaniem" }, { status: 400 });
      }
      await prisma.orderItem.update({
        where: { id: itemId },
        data: { status: "SERVED", servedAt: now },
      });
      // Check if all items are served
      const allItems = await prisma.orderItem.findMany({
        where: { orderId, status: { not: "CANCELLED" } },
      });
      const sentItems = allItems.filter((i) => ["SENT", "IN_PROGRESS", "READY", "SERVED"].includes(i.status));
      const allServed = sentItems.length > 0 && sentItems.every((i) => i.status === "SERVED");
      if (allServed) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "SERVED" },
        });
      }
    }

    // Aktualizuj timestamp interakcji
    await touchOrderInteraction(orderId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji statusu" }, { status: 500 });
  }
}
