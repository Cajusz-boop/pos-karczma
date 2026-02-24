export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

/**
 * GET /api/manager/order-counter - get current order counter status
 */
export async function GET() {
  try {
    const lastOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true, createdAt: true },
    });

    const config = await prisma.systemConfig.findUnique({
      where: { key: "orderCounterMax" },
    });
    const maxNumber = (config?.value as number) ?? 9999;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    });

    return NextResponse.json({
      currentNumber: lastOrder?.orderNumber ?? 0,
      lastOrderDate: lastOrder?.createdAt,
      maxNumber,
      todayCount,
      percentUsed: lastOrder ? Math.round((lastOrder.orderNumber / maxNumber) * 100) : 0,
    });
  } catch (e) {
    console.error("[OrderCounter GET]", e);
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 500 });
  }
}

/**
 * POST /api/manager/order-counter - reset order counter
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startFrom, confirm } = body as { startFrom?: number; confirm: boolean };

    if (!confirm) {
      return NextResponse.json(
        { error: "Wymagane potwierdzenie operacji" },
        { status: 400 }
      );
    }

    const lastOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });

    await prisma.systemConfig.upsert({
      where: { key: "orderCounterOffset" },
      update: { value: startFrom ?? 0 },
      create: { key: "orderCounterOffset", value: startFrom ?? 0 },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_COUNTER_RESET", "SystemConfig", "orderCounterOffset", 
      { from: lastOrder?.orderNumber ?? 0 }, 
      { to: startFrom ?? 0 }
    );

    return NextResponse.json({
      message: `Numerator zresetowany. Następne zamówienie: ${(startFrom ?? 0) + 1}`,
      previousNumber: lastOrder?.orderNumber ?? 0,
      nextNumber: (startFrom ?? 0) + 1,
    });
  } catch (e) {
    console.error("[OrderCounter POST]", e);
    return NextResponse.json({ error: "Błąd resetowania" }, { status: 500 });
  }
}

/**
 * PUT /api/manager/order-counter - set max order number
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { maxNumber } = body as { maxNumber: number };

    if (!maxNumber || maxNumber < 100) {
      return NextResponse.json(
        { error: "Maksymalny numer musi być >= 100" },
        { status: 400 }
      );
    }

    await prisma.systemConfig.upsert({
      where: { key: "orderCounterMax" },
      update: { value: maxNumber },
      create: { key: "orderCounterMax", value: maxNumber },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_COUNTER_MAX_SET", "SystemConfig", "orderCounterMax", undefined, { maxNumber });

    return NextResponse.json({
      message: `Maksymalny numer zamówienia ustawiony na ${maxNumber}`,
      maxNumber,
    });
  } catch (e) {
    console.error("[OrderCounter PUT]", e);
    return NextResponse.json({ error: "Błąd ustawiania" }, { status: 500 });
  }
}
