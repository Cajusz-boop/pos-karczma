export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CONFIG_KEY = "training_mode";

/**
 * GET /api/training — check if training mode is active
 */
export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });
    const isActive = config?.value && typeof config.value === "object"
      ? (config.value as { active?: boolean }).active === true
      : false;

    return NextResponse.json({ trainingMode: isActive });
  } catch (e) {
    console.error("[Training GET]", e);
    return NextResponse.json({ trainingMode: false });
  }
}

/**
 * POST /api/training — toggle training mode
 * Body: { active: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const active = Boolean(body.active);

    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      create: { key: CONFIG_KEY, value: { active, activatedAt: new Date().toISOString() } },
      update: { value: { active, activatedAt: active ? new Date().toISOString() : null } },
    });

    return NextResponse.json({ trainingMode: active });
  } catch (e) {
    console.error("[Training POST]", e);
    return NextResponse.json({ error: "Błąd zmiany trybu" }, { status: 500 });
  }
}

/**
 * DELETE /api/training — reset training data (delete training orders)
 * Deletes all orders created during training mode.
 */
export async function DELETE() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });
    const activatedAt = config?.value && typeof config.value === "object"
      ? (config.value as { activatedAt?: string }).activatedAt
      : null;

    if (!activatedAt) {
      return NextResponse.json({ error: "Tryb szkoleniowy nie był aktywny" }, { status: 400 });
    }

    // Delete orders created after training mode was activated
    const trainingOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(activatedAt) },
        note: { contains: "[SZKOLENIE]" },
      },
      select: { id: true },
    });

    const orderIds = trainingOrders.map((o) => o.id);

    if (orderIds.length > 0) {
      // Delete related records in order
      await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.tip.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    // Deactivate training mode
    await prisma.systemConfig.update({
      where: { key: CONFIG_KEY },
      data: { value: { active: false, activatedAt: null } },
    });

    return NextResponse.json({
      deleted: orderIds.length,
      message: `Usunięto ${orderIds.length} zamówień szkoleniowych`,
    });
  } catch (e) {
    console.error("[Training DELETE]", e);
    return NextResponse.json({ error: "Błąd resetowania danych" }, { status: 500 });
  }
}
