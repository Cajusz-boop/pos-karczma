export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


/**
 * GET /api/cash/current - get current cash in drawer
 * 
 * Calculates cash based on:
 * - Opening balance from current shift
 * - Cash payments received
 * - Cash payouts
 * - Cash refunds
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentShift = await prisma.shift.findFirst({
      where: {
        endedAt: null,
        ...(userId && { userId }),
      },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        startedAt: true,
        cashStart: true,
        userId: true,
        user: { select: { name: true } },
      },
    });

    const shiftStart = currentShift?.startedAt ?? today;

    const cashPayments = await prisma.payment.aggregate({
      where: {
        method: "CASH",
        createdAt: { gte: shiftStart },
        ...(userId && { order: { userId } }),
      },
      _sum: { amount: true },
    });

    const cashOperations = await prisma.cashOperation.findMany({
      where: {
        createdAt: { gte: shiftStart },
        ...(userId && { userId }),
      },
      select: {
        type: true,
        amount: true,
      },
    });

    const payouts = cashOperations
      .filter((op) => op.type === "WITHDRAWAL")
      .reduce((sum, op) => sum + Number(op.amount), 0);

    const deposits = cashOperations
      .filter((op) => op.type === "DEPOSIT")
      .reduce((sum, op) => sum + Number(op.amount), 0);

    const refunds = await prisma.payment.aggregate({
      where: {
        method: "CASH",
        amount: { lt: 0 },
        createdAt: { gte: shiftStart },
        ...(userId && { order: { userId } }),
      },
      _sum: { amount: true },
    });

    const openingBalance = currentShift?.cashStart
      ? Number(currentShift.cashStart)
      : 0;

    const cashReceived = Number(cashPayments._sum.amount ?? 0);
    const cashRefunded = Math.abs(Number(refunds._sum.amount ?? 0));

    const currentCash =
      openingBalance + cashReceived + deposits - payouts - cashRefunded;

    const recentTransactions = await prisma.payment.findMany({
      where: {
        method: "CASH",
        createdAt: { gte: shiftStart },
        ...(userId && { order: { userId } }),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        order: { select: { orderNumber: true, table: { select: { number: true } } } },
      },
    });

    return NextResponse.json({
      currentCash,
      breakdown: {
        openingBalance,
        cashReceived,
        deposits,
        payouts,
        refunds: cashRefunded,
      },
      shift: currentShift
        ? {
            id: currentShift.id,
            userName: currentShift.user.name,
            startedAt: currentShift.startedAt,
          }
        : null,
      recentTransactions: recentTransactions.map((t) => ({
        amount: Number(t.amount),
        orderNumber: t.order.orderNumber,
        tableNumber: t.order.table?.number,
        createdAt: t.createdAt,
      })),
    });
  } catch (e) {
    console.error("[CashCurrent GET]", e);
    return NextResponse.json({ error: "Błąd pobierania stanu kasy" }, { status: 500 });
  }
}
