import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

/** GET /api/reports/shift?userId=&dateFrom=&dateTo= — raport zmianowy (obrót kelnera, rachunki, goście, płatności, napiwki, storna) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: "Wymagane: dateFrom, dateTo (YYYY-MM-DD)" }, { status: 400 });
    }
    const from = startOfDay(new Date(dateFrom));
    const to = endOfDay(new Date(dateTo));

    const where: { userId?: string; status: "CLOSED"; closedAt: { gte: Date; lte: Date } } = {
      status: "CLOSED",
      closedAt: { gte: from, lte: to },
    };
    if (userId) where.userId = userId;

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        payments: true,
        tips: true,
        items: { where: { status: { not: "CANCELLED" } } },
      },
    });

    const byUser: Record<
      string,
      {
        userName: string;
        orderCount: number;
        totalGross: number;
        guestCount: number;
        paymentBreakdown: Record<string, number>;
        tipsTotal: number;
        cancelCount: number;
        cancelAmount: number;
      }
    > = {};

    for (const order of orders) {
      const uid = order.userId;
      if (!byUser[uid]) {
        byUser[uid] = {
          userName: order.user.name,
          orderCount: 0,
          totalGross: 0,
          guestCount: 0,
          paymentBreakdown: { CASH: 0, CARD: 0, BLIK: 0, TRANSFER: 0, VOUCHER: 0 },
          tipsTotal: 0,
          cancelCount: 0,
          cancelAmount: 0,
        };
      }
      const u = byUser[uid];
      u.orderCount += 1;
      u.guestCount += order.guestCount;
      for (const p of order.payments) {
        u.totalGross += Number(p.amount);
        u.paymentBreakdown[p.method] = (u.paymentBreakdown[p.method] ?? 0) + Number(p.amount);
      }
      for (const t of order.tips) {
        u.tipsTotal += Number(t.amount);
      }
    }

    const cancelled = await prisma.order.findMany({
      where: { status: "CANCELLED", closedAt: { gte: from, lte: to }, ...(userId ? { userId } : {}) },
      include: { user: { select: { name: true } }, items: { where: { status: "CANCELLED" } } },
    });
    for (const order of cancelled) {
      const uid = order.userId;
      if (!byUser[uid]) {
        byUser[uid] = {
          userName: order.user.name,
          orderCount: 0,
          totalGross: 0,
          guestCount: 0,
          paymentBreakdown: {},
          tipsTotal: 0,
          cancelCount: 0,
          cancelAmount: 0,
        };
      }
      byUser[uid].cancelCount += 1;
      for (const item of order.items) {
        byUser[uid].cancelAmount += Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount ?? 0);
      }
    }

    const list = Object.entries(byUser).map(([id, v]) => ({
      userId: id,
      userName: v.userName,
      orderCount: v.orderCount,
      totalGross: Math.round(v.totalGross * 100) / 100,
      guestCount: v.guestCount,
      paymentBreakdown: v.paymentBreakdown,
      tipsTotal: Math.round(v.tipsTotal * 100) / 100,
      cancelCount: v.cancelCount,
      cancelAmount: Math.round(v.cancelAmount * 100) / 100,
    }));

    return NextResponse.json({ dateFrom: dateFrom.slice(0, 10), dateTo: dateTo.slice(0, 10), shifts: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd raportu zmianowego" }, { status: 500 });
  }
}
