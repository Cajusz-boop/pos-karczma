export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"stationId":"_"} ];
}



export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ stationId: string }> }
) {
  try {
    const { stationId } = await params;
    const station = await prisma.kDSStation.findUnique({
      where: { id: stationId },
      include: { categories: { select: { categoryId: true } } },
    });
    if (!station) {
      return NextResponse.json({ error: "Stacja nie istnieje" }, { status: 404 });
    }
    const categoryIds = station.categories.map((c) => c.categoryId);

    const retentionMinutes = await prisma.systemConfig
      .findUnique({ where: { key: "kdsServedRetentionMinutes" } })
      .then((c) => (c?.value as number) ?? 30);
    const servedSince = new Date(Date.now() - retentionMinutes * 60 * 1000);

    const items = await prisma.orderItem.findMany({
      where: {
        status: { in: ["SENT", "IN_PROGRESS", "READY"] },
        product: { categoryId: { in: categoryIds } },
        order: {
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
      },
      include: {
        product: { select: { name: true, categoryId: true, estimatedPrepMinutes: true } },
        order: {
          include: {
            table: { select: { number: true } },
            user: { select: { name: true } },
            banquetEvent: { select: { id: true } },
          },
        },
      },
      orderBy: [{ sentToKitchenAt: "asc" }, { createdAt: "asc" }],
    });

    const orderIds = Array.from(new Set(items.map((i) => i.orderId)));
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { table: true, user: { select: { name: true } }, banquetEvent: true },
    });
    const orderMap = Object.fromEntries(orders.map((o) => [o.id, o]));

    const activeByOrder = new Map<
      string,
      {
        orderId: string;
        orderNumber: number;
        tableNumber: number | null;
        type: string;
        courseReleasedUpTo: number;
        waiterName: string;
        guestCount: number;
        banquetName: string | null;
        sentAt: Date | null;
        items: Array<{
          id: string;
          productName: string;
          quantity: number;
          note: string | null;
          modifiersJson: unknown;
          courseNumber: number;
          status: string;
          isModifiedAfterSend: boolean;
          cancelReason: string | null;
          elapsedMinutes: number;
          estimatedMinutes: number | null;
          urgency: number | null;
        }>;
      }
    >();

    for (const item of items) {
      const order = orderMap[item.orderId];
      if (!order) continue;
      if (order.type === "BANQUET" && item.courseNumber > order.courseReleasedUpTo) continue;

      let card = activeByOrder.get(order.id);
      if (!card) {
        const sentAt =
          item.sentToKitchenAt ??
          items.filter((i) => i.orderId === order.id).reduce((acc, i) => acc ?? i.sentToKitchenAt ?? i.createdAt, null as Date | null);
        card = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableNumber: order.table?.number ?? null,
          type: order.type,
          courseReleasedUpTo: order.courseReleasedUpTo,
          waiterName: order.user?.name ?? "",
          guestCount: order.guestCount,
          banquetName: order.banquetEvent?.id ? `Bankiet #${order.orderNumber}` : null,
          sentAt: sentAt ?? item.createdAt,
          items: [],
        };
        activeByOrder.set(order.id, card);
      }
        card.waiterName = order.user?.name ?? "";
      const now = Date.now();
      const sentTime = item.sentToKitchenAt?.getTime() ?? item.createdAt.getTime();
      const elapsedMinutes = (now - sentTime) / 60000;
      const estimatedMinutes = item.product.estimatedPrepMinutes ?? null;
      const urgency = estimatedMinutes
        ? Math.round(((elapsedMinutes / estimatedMinutes) * 100))
        : null;

      card.items.push({
        id: item.id,
        productName: item.product.name,
        quantity: Number(item.quantity),
        note: item.note,
        modifiersJson: item.modifiersJson,
        courseNumber: item.courseNumber,
        status: item.status,
        isModifiedAfterSend: item.isModifiedAfterSend,
        cancelReason: item.cancelReason,
        elapsedMinutes: Math.round(elapsedMinutes * 10) / 10,
        estimatedMinutes,
        urgency,
      });
    }

    // Sort by priority: overdue items first, then by wait time
    const active = Array.from(activeByOrder.values())
      .map((card) => {
        const maxUrgency = Math.max(
          0,
          ...card.items
            .filter((i): i is typeof i & { urgency: number } => i.urgency != null)
            .map((i) => i.urgency)
        );
        const hasOverdue = card.items.some((i) => i.urgency != null && i.urgency > 100);
        const isBanquet = card.type === "BANQUET";
        // Priority score: higher = more urgent
        const priority =
          (hasOverdue ? 1000 : 0) +
          (isBanquet ? 200 : 0) +
          maxUrgency +
          ((Date.now() - (card.sentAt?.getTime() ?? 0)) / 60000);
        return { ...card, priority, maxUrgency, hasOverdue };
      })
      .sort((a, b) => b.priority - a.priority);

    const servedItems = await prisma.orderItem.findMany({
      where: {
        status: "SERVED",
        product: { categoryId: { in: categoryIds } },
        servedAt: { gte: servedSince },
      },
      include: {
        product: { select: { name: true } },
        order: {
          select: {
            orderNumber: true,
            type: true,
            table: { select: { number: true } },
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { servedAt: "desc" },
      take: 50,
    });

    const servedByOrder = new Map<
      string,
      { orderNumber: number; tableNumber: number | null; type: string; waiterName: string; servedAt: Date; items: string[] }
    >();
    for (const item of servedItems) {
      const o = item.order;
      let e = servedByOrder.get(item.orderId);
      if (!e) {
        e = {
          orderNumber: o.orderNumber,
          tableNumber: o.table?.number ?? null,
          type: o.type,
          waiterName: o.user.name,
          servedAt: item.servedAt ?? new Date(),
          items: [],
        };
        servedByOrder.set(item.orderId, e);
      }
      e.items.push(`${item.product.name} × ${Number(item.quantity)}`);
      if (item.servedAt && item.servedAt > e.servedAt) e.servedAt = item.servedAt;
    }
    const served = Array.from(servedByOrder.entries()).map(([orderId, v]) => ({
      orderId,
      ...v,
    }));

    return NextResponse.json({ active, served });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania zamówień KDS" }, { status: 500 });
  }
}
