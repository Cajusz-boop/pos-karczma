export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/shifts/[id] — detailed shift info with turnover breakdown */

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!shift) return NextResponse.json({ error: "Zmiana nie istnieje" }, { status: 404 });

    const payments = await prisma.payment.findMany({
      where: {
        order: {
          userId: shift.userId,
          status: "CLOSED",
          closedAt: { gte: shift.startedAt, ...(shift.endedAt ? { lte: shift.endedAt } : {}) },
        },
      },
      select: { amount: true, method: true, tipAmount: true },
    });

    const paymentBreakdown: Record<string, number> = { CASH: 0, CARD: 0, BLIK: 0, TRANSFER: 0, VOUCHER: 0 };
    let totalTurnover = 0;
    let totalTips = 0;

    for (const p of payments) {
      const amt = Number(p.amount);
      paymentBreakdown[p.method] = (paymentBreakdown[p.method] ?? 0) + amt;
      totalTurnover += amt;
      totalTips += Number(p.tipAmount ?? 0);
    }

    const cashTurnover = paymentBreakdown.CASH ?? 0;
    const expectedCash = Number(shift.cashStart) + cashTurnover;

    const orderCount = await prisma.order.count({
      where: {
        userId: shift.userId,
        status: "CLOSED",
        closedAt: { gte: shift.startedAt, ...(shift.endedAt ? { lte: shift.endedAt } : {}) },
      },
    });

    const cancelCount = await prisma.order.count({
      where: {
        userId: shift.userId,
        status: "CANCELLED",
        createdAt: { gte: shift.startedAt, ...(shift.endedAt ? { lte: shift.endedAt } : {}) },
      },
    });

    const cashEndNum = shift.cashEnd != null ? Number(shift.cashEnd) : null;
    const shortage = cashEndNum != null ? Math.round((cashEndNum - expectedCash) * 100) / 100 : null;

    return NextResponse.json({
      id: shift.id,
      userId: shift.userId,
      userName: shift.user.name,
      startedAt: shift.startedAt.toISOString(),
      endedAt: shift.endedAt?.toISOString() ?? null,
      cashStart: Number(shift.cashStart),
      cashEnd: cashEndNum,
      status: shift.status,
      totalTurnover: Math.round(totalTurnover * 100) / 100,
      cashTurnover: Math.round(cashTurnover * 100) / 100,
      expectedCash: Math.round(expectedCash * 100) / 100,
      shortage,
      totalTips: Math.round(totalTips * 100) / 100,
      orderCount,
      cancelCount,
      paymentBreakdown,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania zmiany" }, { status: 500 });
  }
}

/** PATCH /api/shifts/[id] — close shift with cash declaration, optional handover, and report */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { cashEnd, status: newStatus, handoverToUserId } = body as {
      cashEnd?: number;
      status?: string;
      handoverToUserId?: string;
    };

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });
    if (!shift) return NextResponse.json({ error: "Zmiana nie istnieje" }, { status: 404 });
    if (shift.status !== "OPEN") {
      return NextResponse.json({ error: "Zmiana jest już zamknięta" }, { status: 400 });
    }

    const now = new Date();
    const data: { endedAt?: Date; cashEnd?: number; status?: "OPEN" | "CLOSED" } = {};

    if (newStatus === "CLOSED") {
      data.status = "CLOSED";
      data.endedAt = now;
      if (cashEnd != null) data.cashEnd = Number(cashEnd);

      // Handover: transfer open orders and table assignments to another user
      if (handoverToUserId && handoverToUserId !== shift.userId) {
        const targetUser = await prisma.user.findUnique({
          where: { id: handoverToUserId },
          select: { id: true },
        });
        if (!targetUser) {
          return NextResponse.json({ error: "Docelowy użytkownik nie istnieje" }, { status: 404 });
        }
        const openOrders = await prisma.order.findMany({
          where: { userId: shift.userId, status: "OPEN" },
          select: { id: true, tableId: true },
        });
        const tableIds = Array.from(new Set(openOrders.map((o) => o.tableId).filter((id): id is string => Boolean(id))));
        await prisma.$transaction([
          prisma.order.updateMany({
            where: { id: { in: openOrders.map((o) => o.id) } },
            data: { userId: handoverToUserId },
          }),
          ...tableIds.map((tableId) =>
            prisma.table.update({
              where: { id: tableId },
              data: { assignedUser: handoverToUserId },
            })
          ),
        ]);
      }

      // Calculate expected cash for audit
      const payments = await prisma.payment.findMany({
        where: {
          order: {
            userId: shift.userId,
            status: "CLOSED",
            closedAt: { gte: shift.startedAt },
          },
          method: "CASH",
        },
        select: { amount: true },
      });
      const cashTurnover = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const expectedCash = Number(shift.cashStart) + cashTurnover;
      const shortage = cashEnd != null ? Math.round((cashEnd - expectedCash) * 100) / 100 : null;

      const userId = request.headers.get("x-user-id");
      await auditLog(userId, "SHIFT_CLOSE", "Shift", id, undefined, {
        userName: shift.user.name,
        cashStart: Number(shift.cashStart),
        cashEnd: cashEnd ?? null,
        expectedCash: Math.round(expectedCash * 100) / 100,
        shortage,
        cashTurnover: Math.round(cashTurnover * 100) / 100,
        ...(handoverToUserId && { handoverToUserId }),
      });
    }

    const updated = await prisma.shift.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true } } },
    });

    // Return full report for closed shift
    const payments = await prisma.payment.findMany({
      where: {
        order: {
          userId: shift.userId,
          status: "CLOSED",
          closedAt: { gte: shift.startedAt, ...(updated.endedAt ? { lte: updated.endedAt } : {}) },
        },
      },
      select: { amount: true, method: true, tipAmount: true },
    });

    const paymentBreakdown: Record<string, number> = { CASH: 0, CARD: 0, BLIK: 0, TRANSFER: 0, VOUCHER: 0 };
    let totalTurnover = 0;
    let totalTips = 0;
    for (const p of payments) {
      paymentBreakdown[p.method] = (paymentBreakdown[p.method] ?? 0) + Number(p.amount);
      totalTurnover += Number(p.amount);
      totalTips += Number(p.tipAmount ?? 0);
    }

    const cashTurnover = paymentBreakdown.CASH ?? 0;
    const expectedCash = Number(shift.cashStart) + cashTurnover;
    const cashEndNum = updated.cashEnd != null ? Number(updated.cashEnd) : null;
    const shortage = cashEndNum != null ? Math.round((cashEndNum - expectedCash) * 100) / 100 : null;

    const orderCount = await prisma.order.count({
      where: {
        userId: shift.userId,
        status: "CLOSED",
        closedAt: { gte: shift.startedAt, ...(updated.endedAt ? { lte: updated.endedAt } : {}) },
      },
    });

    return NextResponse.json({
      id: updated.id,
      userId: updated.userId,
      userName: updated.user.name,
      startedAt: updated.startedAt.toISOString(),
      endedAt: updated.endedAt?.toISOString() ?? null,
      cashStart: Number(updated.cashStart),
      cashEnd: cashEndNum,
      status: updated.status,
      totalTurnover: Math.round(totalTurnover * 100) / 100,
      cashTurnover: Math.round(cashTurnover * 100) / 100,
      expectedCash: Math.round(expectedCash * 100) / 100,
      shortage,
      totalTips: Math.round(totalTips * 100) / 100,
      orderCount,
      paymentBreakdown,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zamknięcia zmiany" }, { status: 500 });
  }
}
