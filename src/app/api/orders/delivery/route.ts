import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";
import { sendPushToRole, sendPushToUser } from "@/lib/push/web-push";

const createDeliverySchema = z.object({
  type: z.enum(["PHONE", "DELIVERY"]),
  deliveryPhone: z.string().min(1, "Wymagany numer telefonu"),
  deliveryAddress: z.string().optional(),
  deliveryNote: z.string().optional(),
  estimatedMinutes: z.number().int().min(5).max(240).optional(),
  customerId: z.string().optional(),
  deliveryZoneId: z.string().optional(),
  deliveryCost: z.number().min(0).optional(),
});

const updateStatusSchema = z.object({
  orderId: z.string().min(1),
  deliveryStatus: z.enum(["PENDING", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
});

/**
 * GET /api/orders/delivery — list phone/delivery orders
 * Query: ?status=PENDING,PREPARING&date=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const date = searchParams.get("date");

    const dateFrom = date ? new Date(date) : new Date(new Date().setHours(0, 0, 0, 0));
    const dateTo = date ? new Date(date + "T23:59:59") : new Date();

    const where: Record<string, unknown> = {
      type: { in: ["PHONE", "DELIVERY"] },
      createdAt: { gte: dateFrom, lte: dateTo },
    };

    if (statusFilter) {
      const statuses = statusFilter.split(",").map((s) => s.trim());
      where.deliveryStatus = { in: statuses };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
        deliveryZone: { select: { id: true, number: true, name: true } },
        items: {
          where: { status: { not: "CANCELLED" } },
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const driverIds = orders.map((o) => o.assignedDriverId).filter((id): id is string => id !== null);
    const drivers = driverIds.length > 0
      ? await prisma.deliveryDriver.findMany({
          where: { id: { in: driverIds } },
          include: { user: { select: { id: true, name: true } } },
        })
      : [];
    const driverMap = new Map(drivers.map((d) => [d.id, d]));

    return NextResponse.json({
      orders: orders.map((o) => {
        const driver = o.assignedDriverId ? driverMap.get(o.assignedDriverId) : null;
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          type: o.type,
          status: o.status,
          deliveryStatus: o.deliveryStatus,
          deliveryPhone: o.deliveryPhone,
          deliveryAddress: o.deliveryAddress,
          deliveryNote: o.deliveryNote,
          estimatedAt: o.estimatedAt?.toISOString() ?? null,
          deliveredAt: o.deliveredAt?.toISOString() ?? null,
          deliveryCost: o.deliveryCost ? Number(o.deliveryCost) : null,
          driverCommission: o.driverCommission ? Number(o.driverCommission) : null,
          createdAt: o.createdAt.toISOString(),
          user: o.user,
          customer: o.customer,
          zone: o.deliveryZone,
          driver: driver ? { id: driver.id, name: driver.user.name } : null,
          items: o.items.map((i) => ({
            id: i.id,
            productName: i.product.name,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
          total: o.items.reduce(
            (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice) - Number(i.discountAmount ?? 0),
            0
          ) + (o.deliveryCost ? Number(o.deliveryCost) : 0),
        };
      }),
    });
  } catch (e) {
    console.error("[Delivery GET]", e);
    return NextResponse.json({ error: "Błąd pobierania zamówień" }, { status: 500 });
  }
}

/**
 * POST /api/orders/delivery — create a phone/delivery order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createDeliverySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { type, deliveryPhone, deliveryAddress, deliveryNote, estimatedMinutes, customerId, deliveryZoneId, deliveryCost } = parsed.data;

    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Wymagane zalogowanie" }, { status: 401 });
    }

    const maxOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });

    const estimatedAt = estimatedMinutes
      ? new Date(Date.now() + estimatedMinutes * 60_000)
      : null;

    let zoneId = deliveryZoneId ?? null;
    let finalDeliveryCost = deliveryCost ?? null;
    let driverCommission = null;

    if (type === "DELIVERY" && !zoneId && deliveryAddress) {
      const normalizedAddress = deliveryAddress.toLowerCase().trim();
      const streetMatch = normalizedAddress.match(/^(ul\.?\s*)?([a-ząćęłńóśźż\s]+)/i);
      const streetName = streetMatch?.[2]?.trim() ?? normalizedAddress;

      const matchingStreet = await prisma.deliveryStreet.findFirst({
        where: {
          streetName: { contains: streetName },
          zone: { isActive: true },
        },
        include: { zone: true },
      });

      if (matchingStreet) {
        zoneId = matchingStreet.zoneId;
        finalDeliveryCost = finalDeliveryCost ?? Number(matchingStreet.zone.deliveryCost);
        driverCommission = Number(matchingStreet.zone.driverCommission);
      }
    }

    if (type === "DELIVERY" && zoneId && finalDeliveryCost === null) {
      const zone = await prisma.deliveryZone.findUnique({
        where: { id: zoneId },
      });
      if (zone) {
        finalDeliveryCost = Number(zone.deliveryCost);
        driverCommission = Number(zone.driverCommission);
      }
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: (maxOrder?.orderNumber ?? 0) + 1,
        userId,
        type,
        status: "OPEN",
        guestCount: 1,
        deliveryPhone,
        deliveryAddress: deliveryAddress ?? null,
        deliveryNote: deliveryNote ?? null,
        deliveryStatus: "PENDING",
        estimatedAt,
        customerId: customerId ?? null,
        deliveryZoneId: zoneId,
        deliveryCost: finalDeliveryCost,
        driverCommission,
        note: type === "DELIVERY"
          ? `Dostawa: ${deliveryAddress || deliveryPhone}`
          : `Tel: ${deliveryPhone}`,
      },
    });

    await auditLog(userId, "ORDER_DELIVERY_CREATED", "Order", order.id, undefined, {
      type,
      deliveryPhone,
      deliveryAddress,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    console.error("[Delivery POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia zamówienia" }, { status: 500 });
  }
}

const STATUS_NOTIFICATIONS: Record<string, { title: string; body: (orderNum: number) => string }> = {
  PREPARING: {
    title: "Zamówienie w przygotowaniu",
    body: (n) => `Zamówienie #${n} jest przygotowywane`,
  },
  READY_FOR_PICKUP: {
    title: "Zamówienie gotowe!",
    body: (n) => `Zamówienie #${n} czeka na kierowcę`,
  },
  OUT_FOR_DELIVERY: {
    title: "W drodze!",
    body: (n) => `Zamówienie #${n} jedzie do klienta`,
  },
  DELIVERED: {
    title: "Dostarczono",
    body: (n) => `Zamówienie #${n} zostało dostarczone`,
  },
};

/**
 * PATCH /api/orders/delivery — update delivery status
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { orderId, deliveryStatus } = parsed.data;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { deliveryStatus },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        deliveryStatus: true,
        assignedDriverId: true,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DELIVERY_STATUS_UPDATED", "Order", orderId, undefined, {
      deliveryStatus,
    });

    const notifConfig = STATUS_NOTIFICATIONS[deliveryStatus];
    if (notifConfig) {
      if (deliveryStatus === "READY_FOR_PICKUP") {
        sendPushToRole("ADMIN", {
          title: notifConfig.title,
          body: notifConfig.body(order.orderNumber),
          data: { type: "DELIVERY_STATUS", orderId },
        }).catch(console.error);
      }

      if (order.userId) {
        sendPushToUser(order.userId, {
          title: notifConfig.title,
          body: notifConfig.body(order.orderNumber),
          data: { type: "DELIVERY_STATUS", orderId },
        }).catch(console.error);
      }

      if (order.assignedDriverId) {
        const driver = await prisma.deliveryDriver.findUnique({
          where: { id: order.assignedDriverId },
          select: { userId: true },
        });
        if (driver) {
          sendPushToUser(driver.userId, {
            title: notifConfig.title,
            body: notifConfig.body(order.orderNumber),
            data: { type: "DELIVERY_STATUS", orderId },
          }).catch(console.error);
        }
      }
    }

    return NextResponse.json({ order });
  } catch (e) {
    console.error("[Delivery PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji statusu" }, { status: 500 });
  }
}
