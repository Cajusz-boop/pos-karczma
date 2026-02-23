import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';


/**
 * GET /api/reports/delivery - delivery report
 * Query: ?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&driverId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFromStr = searchParams.get("dateFrom");
    const dateToStr = searchParams.get("dateTo");
    const driverId = searchParams.get("driverId");

    const today = new Date();
    const dateFrom = dateFromStr
      ? new Date(dateFromStr)
      : new Date(today.setDate(today.getDate() - 7));
    dateFrom.setHours(0, 0, 0, 0);

    const dateTo = dateToStr ? new Date(dateToStr) : new Date();
    dateTo.setHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      type: { in: ["DELIVERY", "PHONE"] },
      createdAt: { gte: dateFrom, lte: dateTo },
      status: "CLOSED",
    };

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        type: true,
        deliveryStatus: true,
        deliveryCost: true,
        driverCommission: true,
        totalGross: true,
        assignedDriverId: true,
        deliveryZoneId: true,
        createdAt: true,
        closedAt: true,
        deliveredAt: true,
        payments: {
          select: { method: true, amount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const driverIds = Array.from(new Set(orders.map((o) => o.assignedDriverId).filter(Boolean))) as string[];
    const zoneIds = Array.from(new Set(orders.map((o) => o.deliveryZoneId).filter(Boolean))) as string[];

    const [drivers, zones] = await Promise.all([
      prisma.deliveryDriver.findMany({
        where: driverIds.length > 0 ? { id: { in: driverIds } } : undefined,
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.deliveryZone.findMany({
        where: zoneIds.length > 0 ? { id: { in: zoneIds } } : undefined,
        select: { id: true, number: true, name: true },
      }),
    ]);

    const driverMap = new Map(drivers.map((d) => [d.id, d.user.name]));
    const zoneMap = new Map(zones.map((z) => [z.id, z]));

    const filteredOrders = driverId
      ? orders.filter((o) => o.assignedDriverId === driverId)
      : orders;

    const summary = {
      totalOrders: filteredOrders.length,
      deliveredOrders: filteredOrders.filter((o) => o.deliveryStatus === "DELIVERED").length,
      cancelledOrders: filteredOrders.filter((o) => o.deliveryStatus === "CANCELLED").length,
      totalValue: filteredOrders.reduce((sum, o) => sum + Number(o.totalGross), 0),
      totalDeliveryCost: filteredOrders.reduce((sum, o) => sum + Number(o.deliveryCost ?? 0), 0),
      totalCommission: filteredOrders.reduce((sum, o) => sum + Number(o.driverCommission ?? 0), 0),
      cashCollected: filteredOrders.reduce((sum, o) => {
        const cash = o.payments.filter((p) => p.method === "CASH");
        return sum + cash.reduce((s, p) => s + Number(p.amount), 0);
      }, 0),
      cardPayments: filteredOrders.reduce((sum, o) => {
        const card = o.payments.filter((p) => p.method === "CARD" || p.method === "BLIK");
        return sum + card.reduce((s, p) => s + Number(p.amount), 0);
      }, 0),
    };

    const byDriver: Record<string, {
      driverId: string;
      driverName: string;
      orders: number;
      delivered: number;
      totalValue: number;
      commission: number;
      cashCollected: number;
    }> = {};

    for (const order of filteredOrders) {
      const dId = order.assignedDriverId ?? "unassigned";
      const dName = order.assignedDriverId ? driverMap.get(order.assignedDriverId) ?? "?" : "Nieprzypisany";

      if (!byDriver[dId]) {
        byDriver[dId] = {
          driverId: dId,
          driverName: dName,
          orders: 0,
          delivered: 0,
          totalValue: 0,
          commission: 0,
          cashCollected: 0,
        };
      }

      byDriver[dId].orders++;
      if (order.deliveryStatus === "DELIVERED") byDriver[dId].delivered++;
      byDriver[dId].totalValue += Number(order.totalGross);
      byDriver[dId].commission += Number(order.driverCommission ?? 0);

      const cash = order.payments.filter((p) => p.method === "CASH");
      byDriver[dId].cashCollected += cash.reduce((s, p) => s + Number(p.amount), 0);
    }

    const byZone: Record<string, {
      zoneId: string;
      zoneName: string;
      zoneNumber: number;
      orders: number;
      totalValue: number;
      deliveryCost: number;
    }> = {};

    for (const order of filteredOrders) {
      const zId = order.deliveryZoneId ?? "unknown";
      const zone = order.deliveryZoneId ? zoneMap.get(order.deliveryZoneId) : null;

      if (!byZone[zId]) {
        byZone[zId] = {
          zoneId: zId,
          zoneName: zone?.name ?? "Nieznana",
          zoneNumber: zone?.number ?? 0,
          orders: 0,
          totalValue: 0,
          deliveryCost: 0,
        };
      }

      byZone[zId].orders++;
      byZone[zId].totalValue += Number(order.totalGross);
      byZone[zId].deliveryCost += Number(order.deliveryCost ?? 0);
    }

    const byDay: Record<string, {
      date: string;
      orders: number;
      totalValue: number;
      delivered: number;
    }> = {};

    for (const order of filteredOrders) {
      const dateKey = order.createdAt.toISOString().split("T")[0];

      if (!byDay[dateKey]) {
        byDay[dateKey] = {
          date: dateKey,
          orders: 0,
          totalValue: 0,
          delivered: 0,
        };
      }

      byDay[dateKey].orders++;
      byDay[dateKey].totalValue += Number(order.totalGross);
      if (order.deliveryStatus === "DELIVERED") byDay[dateKey].delivered++;
    }

    return NextResponse.json({
      period: {
        from: dateFrom.toISOString().split("T")[0],
        to: dateTo.toISOString().split("T")[0],
      },
      summary,
      byDriver: Object.values(byDriver).sort((a, b) => b.orders - a.orders),
      byZone: Object.values(byZone).sort((a, b) => a.zoneNumber - b.zoneNumber),
      byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
      orders: filteredOrders.slice(0, 100).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        type: o.type,
        status: o.deliveryStatus,
        driver: o.assignedDriverId ? driverMap.get(o.assignedDriverId) : null,
        zone: o.deliveryZoneId ? zoneMap.get(o.deliveryZoneId)?.name : null,
        total: Number(o.totalGross),
        deliveryCost: Number(o.deliveryCost ?? 0),
        commission: Number(o.driverCommission ?? 0),
        createdAt: o.createdAt.toISOString(),
        deliveredAt: o.deliveredAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    console.error("[DeliveryReport GET]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d generowania raportu" }, { status: 500 });
  }
}
