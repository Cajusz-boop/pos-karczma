import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export const dynamic = 'force-dynamic';


/** GET /api/reports/daily?date=YYYY-MM-DD â€” raport dobowy (obrĂłt, pĹ‚atnoĹ›ci, VAT, paragony, faktury, goĹ›cie, Ĺ›redni rachunek, storna) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    if (!dateStr) {
      return NextResponse.json({ error: "Brak parametru date (YYYY-MM-DD)" }, { status: 400 });
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "NieprawidĹ‚owa data" }, { status: 400 });
    }
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const closedOrders = await prisma.order.findMany({
      where: {
        status: "CLOSED",
        closedAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        items: { where: { status: { not: "CANCELLED" } }, include: { taxRate: true } },
        payments: true,
        receipts: true,
      },
    });

    let totalGross = 0;
    let totalNet = 0;
    const vatByRate: Record<string, { net: number; vat: number; gross: number }> = {};
    const paymentBreakdown: Record<string, number> = { CASH: 0, CARD: 0, BLIK: 0, TRANSFER: 0, VOUCHER: 0 };

    for (const order of closedOrders) {
      for (const pay of order.payments) {
        const amt = Number(pay.amount);
        paymentBreakdown[pay.method] = (paymentBreakdown[pay.method] ?? 0) + amt;
      }
      for (const item of order.items) {
        const qty = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const discount = Number(item.discountAmount ?? 0);
        const gross = qty * unitPrice - discount;
        const rate = Number(item.taxRate.ratePercent);
        const net = gross / (1 + rate / 100);
        const vat = gross - net;
        totalGross += gross;
        totalNet += net;
        const key = item.taxRate.fiscalSymbol ?? `VAT${rate}`;
        if (!vatByRate[key]) vatByRate[key] = { net: 0, vat: 0, gross: 0 };
        vatByRate[key].net += net;
        vatByRate[key].vat += vat;
        vatByRate[key].gross += gross;
      }
    }

    const receiptCount = closedOrders.reduce((s, o) => s + o.receipts.length, 0);

    const invoices = await prisma.invoice.count({
      where: {
        issueDate: { gte: dayStart, lte: dayEnd },
      },
    });

    const guestCount = closedOrders.reduce((s, o) => s + o.guestCount, 0);
    const orderCount = closedOrders.length;
    const avgTicket = orderCount > 0 ? totalGross / orderCount : 0;

    const cancelledOrders = await prisma.order.findMany({
      where: {
        status: "CANCELLED",
        closedAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        items: { where: { status: "CANCELLED" } },
      },
    });
    let cancelAmount = 0;
    for (const order of cancelledOrders) {
      for (const item of order.items) {
        const g = Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount ?? 0);
        cancelAmount += g;
      }
    }

    const report = {
      date: dateStr.slice(0, 10),
      totalGross: Math.round(totalGross * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      vatBreakdownJson: vatByRate,
      paymentBreakdownJson: paymentBreakdown,
      receiptCount,
      invoiceCount: invoices,
      guestCount,
      orderCount,
      avgTicket: Math.round(avgTicket * 100) / 100,
      cancelCount: cancelledOrders.length,
      cancelAmount: Math.round(cancelAmount * 100) / 100,
    };

    return NextResponse.json(report);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d generowania raportu dobowego" }, { status: 500 });
  }
}
