export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";


/**
 * GET /api/manager/cleanup-orders - preview orders to clean up
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get("days") ?? "90");
    const status = searchParams.get("status"); // PAID, CLOSED, CANCELLED

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const where: Record<string, unknown> = {
      createdAt: { lt: cutoff },
    };

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["CLOSED", "CANCELLED"] };
    }

    const count = await prisma.order.count({ where });

    const sample = await prisma.order.findMany({
      where,
      take: 10,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        type: true,
      },
    });

    return NextResponse.json({
      criteria: {
        olderThanDays,
        status: status ?? "PAID, CLOSED, CANCELLED",
        cutoffDate: cutoff,
      },
      count,
      sample,
      warning: count > 0 ? `Uwaga: ${count} zamówień zostanie trwale usuniętych!` : null,
    });
  } catch (e) {
    console.error("[CleanupOrders GET]", e);
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 500 });
  }
}

/**
 * DELETE /api/manager/cleanup-orders - delete old orders
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { olderThanDays, status, confirm, keepFiscalized } = body as {
      olderThanDays: number;
      status?: string;
      confirm: boolean;
      keepFiscalized?: boolean;
    };

    if (!confirm) {
      return NextResponse.json(
        { error: "Wymagane potwierdzenie operacji (confirm: true)" },
        { status: 400 }
      );
    }

    if (!olderThanDays || olderThanDays < 30) {
      return NextResponse.json(
        { error: "Minimalna wartość olderThanDays to 30" },
        { status: 400 }
      );
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const where: Record<string, unknown> = {
      createdAt: { lt: cutoff },
    };

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["CLOSED", "CANCELLED"] };
    }

    if (keepFiscalized) {
      where.fiscalizedAt = null;
    }

    const orderIds = await prisma.order.findMany({
      where,
      select: { id: true },
    });

    const ids = orderIds.map((o) => o.id);

    if (ids.length === 0) {
      return NextResponse.json({ message: "Brak zamówień do usunięcia", deletedCount: 0 });
    }

    await prisma.orderItem.deleteMany({
      where: { orderId: { in: ids } },
    });

    await prisma.payment.deleteMany({
      where: { orderId: { in: ids } },
    });

    const result = await prisma.order.deleteMany({
      where: { id: { in: ids } },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDERS_CLEANUP", "Order", undefined, undefined, {
      count: result.count,
      olderThanDays,
      status: status ?? "PAID, CLOSED, CANCELLED",
      keepFiscalized,
    });

    return NextResponse.json({
      message: `Usunięto ${result.count} zamówień`,
      deletedCount: result.count,
    });
  } catch (e) {
    console.error("[CleanupOrders DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania" }, { status: 500 });
  }
}
