export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { posnetDriver } from "@/lib/fiscal";
import { auditLog } from "@/lib/audit";
import { startOfDay, endOfDay } from "date-fns";

/**
 * GET /api/day-close — preview: open shifts, open orders, cash summary
 */
export async function GET() {
  try {
    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    const [openShifts, openOrders, closedOrders, cancelledOrders] = await Promise.all([
      prisma.shift.findMany({
        where: { status: "OPEN" },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { startedAt: "asc" },
      }),
      prisma.order.count({
        where: { status: { in: ["OPEN", "SENT_TO_KITCHEN", "IN_PROGRESS", "READY", "SERVED", "BILL_REQUESTED"] } },
      }),
      prisma.order.findMany({
        where: { status: "CLOSED", closedAt: { gte: dayStart, lte: dayEnd } },
        include: {
          items: { where: { status: { not: "CANCELLED" } }, include: { taxRate: true } },
          payments: true,
        },
      }),
      prisma.order.count({
        where: { status: "CANCELLED", createdAt: { gte: dayStart, lte: dayEnd } },
      }),
    ]);

    // Calculate totals
    let totalGross = 0;
    const paymentBreakdown: Record<string, number> = { CASH: 0, CARD: 0, BLIK: 0, TRANSFER: 0, VOUCHER: 0 };

    for (const order of closedOrders) {
      for (const item of order.items) {
        const gross = Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount ?? 0);
        totalGross += gross;
      }
      for (const p of order.payments) {
        paymentBreakdown[p.method] = (paymentBreakdown[p.method] ?? 0) + Number(p.amount);
      }
    }

    // Shift summaries
    const shiftSummaries = await Promise.all(
      openShifts.map(async (s) => {
        const payments = await prisma.payment.findMany({
          where: {
            order: { userId: s.userId, status: "CLOSED", closedAt: { gte: s.startedAt } },
          },
          select: { amount: true, method: true },
        });
        const cashPayments = payments
          .filter((p) => p.method === "CASH")
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const totalTurnover = payments.reduce((sum, p) => sum + Number(p.amount), 0);

        return {
          id: s.id,
          userId: s.userId,
          userName: s.user.name,
          startedAt: s.startedAt.toISOString(),
          cashStart: Number(s.cashStart),
          cashTurnover: Math.round(cashPayments * 100) / 100,
          totalTurnover: Math.round(totalTurnover * 100) / 100,
          expectedCash: Math.round((Number(s.cashStart) + cashPayments) * 100) / 100,
        };
      })
    );

    return NextResponse.json({
      date: today.toISOString().slice(0, 10),
      openShifts: shiftSummaries,
      openOrdersCount: openOrders,
      closedOrdersCount: closedOrders.length,
      cancelledOrdersCount: cancelledOrders,
      totalGross: Math.round(totalGross * 100) / 100,
      paymentBreakdown,
      canClose: openOrders === 0,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd podglądu zamknięcia dnia" }, { status: 500 });
  }
}

/**
 * POST /api/day-close — execute day close:
 * 1. Check no open orders
 * 2. Close all open shifts (with cashEnd values from body)
 * 3. Print fiscal daily report
 * 4. Save DailyReport
 * 5. Audit log
 */
export async function POST(request: NextRequest) {
  try {
    let body: { shiftCashEnds?: Record<string, number> } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const shiftCashEnds = body.shiftCashEnds ?? {};

    // 1. Check no open orders
    const openOrders = await prisma.order.count({
      where: { status: { in: ["OPEN", "SENT_TO_KITCHEN", "IN_PROGRESS", "READY", "SERVED", "BILL_REQUESTED"] } },
    });
    if (openOrders > 0) {
      return NextResponse.json(
        { error: `Nie można zamknąć dnia — ${openOrders} otwartych zamówień. Zamknij lub anuluj je najpierw.` },
        { status: 400 }
      );
    }

    // 2. Close all open shifts
    const openShifts = await prisma.shift.findMany({
      where: { status: "OPEN" },
      include: { user: { select: { name: true } } },
    });

    const closedShifts: Array<{ id: string; userName: string; cashEnd: number }> = [];
    const now = new Date();

    for (const shift of openShifts) {
      const cashEnd = shiftCashEnds[shift.id] ?? null;
      await prisma.shift.update({
        where: { id: shift.id },
        data: {
          status: "CLOSED",
          endedAt: now,
          cashEnd: cashEnd != null ? cashEnd : undefined,
        },
      });
      closedShifts.push({
        id: shift.id,
        userName: shift.user.name,
        cashEnd: cashEnd ?? 0,
      });
    }

    // 3. Print fiscal daily report
    const fiscalResult = await posnetDriver.printDailyReport();

    // 4. Generate and save DailyReport
    const today = startOfDay(now);
    const dayEnd = endOfDay(now);

    const closedOrders = await prisma.order.findMany({
      where: { status: "CLOSED", closedAt: { gte: today, lte: dayEnd } },
      include: {
        items: { where: { status: { not: "CANCELLED" } }, include: { taxRate: true } },
        payments: true,
        receipts: true,
        invoices: true,
      },
    });

    let totalGross = 0;
    let totalNet = 0;
    const vatBreakdown: Record<string, { net: number; vat: number; gross: number }> = {};
    const paymentBreakdown: Record<string, number> = { CASH: 0, CARD: 0, BLIK: 0, TRANSFER: 0, VOUCHER: 0 };
    let receiptCount = 0;
    let invoiceCount = 0;
    let guestCount = 0;

    for (const order of closedOrders) {
      guestCount += order.guestCount;
      receiptCount += order.receipts.length;
      invoiceCount += order.invoices.length;

      for (const item of order.items) {
        const gross = Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount ?? 0);
        const rate = Number(item.taxRate.ratePercent);
        const net = gross / (1 + rate / 100);
        const vat = gross - net;
        totalGross += gross;
        totalNet += net;
        const sym = item.taxRate.fiscalSymbol ?? "A";
        if (!vatBreakdown[sym]) vatBreakdown[sym] = { net: 0, vat: 0, gross: 0 };
        vatBreakdown[sym].net += net;
        vatBreakdown[sym].vat += vat;
        vatBreakdown[sym].gross += gross;
      }
      for (const p of order.payments) {
        paymentBreakdown[p.method] = (paymentBreakdown[p.method] ?? 0) + Number(p.amount);
      }
    }

    const cancelledOrders = await prisma.order.findMany({
      where: { status: "CANCELLED", createdAt: { gte: today, lte: dayEnd } },
      include: { items: true },
    });
    const cancelCount = cancelledOrders.length;
    let cancelAmount = 0;
    for (const o of cancelledOrders) {
      cancelAmount += o.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
    }

    const avgTicket = closedOrders.length > 0 ? totalGross / closedOrders.length : 0;

    await prisma.dailyReport.upsert({
      where: { date: today },
      create: {
        date: today,
        totalGross: Math.round(totalGross * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        vatBreakdownJson: vatBreakdown,
        paymentBreakdownJson: paymentBreakdown,
        receiptCount,
        invoiceCount,
        guestCount,
        avgTicket: Math.round(avgTicket * 100) / 100,
        cancelCount,
        cancelAmount: Math.round(cancelAmount * 100) / 100,
      },
      update: {
        totalGross: Math.round(totalGross * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        vatBreakdownJson: vatBreakdown,
        paymentBreakdownJson: paymentBreakdown,
        receiptCount,
        invoiceCount,
        guestCount,
        avgTicket: Math.round(avgTicket * 100) / 100,
        cancelCount,
        cancelAmount: Math.round(cancelAmount * 100) / 100,
      },
    });

    // 5. Audit log
    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DAY_CLOSE", "DailyReport", today.toISOString().slice(0, 10), undefined, {
      closedShifts: closedShifts.length,
      totalGross: Math.round(totalGross * 100) / 100,
      fiscalReportPrinted: fiscalResult.success,
    });

    return NextResponse.json({
      ok: true,
      date: today.toISOString().slice(0, 10),
      closedShifts,
      fiscalReportPrinted: fiscalResult.success,
      fiscalError: fiscalResult.success ? undefined : (fiscalResult.error ?? "Błąd wydruku"),
      report: {
        totalGross: Math.round(totalGross * 100) / 100,
        totalNet: Math.round(totalNet * 100) / 100,
        orderCount: closedOrders.length,
        guestCount,
        receiptCount,
        invoiceCount,
        cancelCount,
        cancelAmount: Math.round(cancelAmount * 100) / 100,
        avgTicket: Math.round(avgTicket * 100) / 100,
        paymentBreakdown,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zamknięcia dnia" }, { status: 500 });
  }
}
