import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { posnetDriver } from "@/lib/fiscal";

/** GET /api/fiscal — status drukarki fiskalnej (test połączenia) */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await posnetDriver.getStatus();
    return NextResponse.json(status);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, connected: false, message: "Błąd połączenia z drukarką fiskalną" },
      { status: 500 }
    );
  }
}

/** POST /api/fiscal — raport dobowy: wydruk na drukarce + zapis DailyReport */
export async function POST() {
  try {
    const result = await posnetDriver.printDailyReport();
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Błąd wydruku raportu dobowego" }, { status: 500 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const closedToday = await prisma.order.findMany({
      where: {
        status: "CLOSED",
        closedAt: { gte: today, lt: tomorrow },
      },
      include: {
        items: { where: { status: { not: "CANCELLED" } }, include: { product: true, taxRate: true } },
        payments: true,
        receipts: true,
        invoices: true,
      },
    });

    let totalGross = 0;
    let totalNet = 0;
    const vatBreakdown: Record<string, { net: number; vat: number; gross: number }> = {};
    const paymentBreakdown: Record<string, number> = { cash: 0, card: 0, blik: 0, transfer: 0 };
    let receiptCount = 0;
    let invoiceCount = 0;
    let cancelCount = 0;
    let cancelAmount = 0;

    for (const order of closedToday) {
      let orderGross = 0;
      for (const item of order.items) {
        const lineGross = Number(item.quantity) * Number(item.unitPrice);
        orderGross += lineGross;
        const rate = Number(item.taxRate?.ratePercent ?? 0);
        const net = lineGross / (1 + rate / 100);
        const vat = lineGross - net;
        const sym = item.taxRate?.fiscalSymbol ?? "A";
        if (!vatBreakdown[sym]) vatBreakdown[sym] = { net: 0, vat: 0, gross: 0 };
        vatBreakdown[sym].net += net;
        vatBreakdown[sym].vat += vat;
        vatBreakdown[sym].gross += lineGross;
      }
      let discount = 0;
      if (order.discountJson && typeof order.discountJson === "object") {
        const d = order.discountJson as { type?: string; value?: number };
        if (d.type === "PERCENT" && typeof d.value === "number") discount = (orderGross * d.value) / 100;
        else if (d.type === "AMOUNT" && typeof d.value === "number") discount = d.value;
      }
      orderGross = Math.max(0, orderGross - discount);
      totalGross += orderGross;
      for (const p of order.payments) {
        const m = (p.method ?? "cash").toLowerCase();
        if (m in paymentBreakdown) (paymentBreakdown as Record<string, number>)[m] += Number(p.amount);
        else paymentBreakdown.transfer += Number(p.amount);
      }
      receiptCount += order.receipts.length;
      invoiceCount += order.invoices.length;
    }

    const cancelledToday = await prisma.order.findMany({
      where: { status: "CANCELLED", createdAt: { gte: today, lt: tomorrow } },
      include: { items: true },
    });
    for (const o of cancelledToday) {
      cancelCount += 1;
      cancelAmount += o.items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
    }

    for (const v of Object.values(vatBreakdown)) {
      totalNet += v.net;
    }

    const guestCount = closedToday.length;
    const avgTicket = guestCount > 0 ? totalGross / guestCount : 0;

    await prisma.dailyReport.upsert({
      where: { date: today },
      create: {
        date: today,
        totalGross,
        totalNet,
        vatBreakdownJson: vatBreakdown,
        paymentBreakdownJson: paymentBreakdown,
        receiptCount,
        invoiceCount,
        guestCount,
        avgTicket,
        cancelCount,
        cancelAmount,
      },
      update: {
        totalGross,
        totalNet,
        vatBreakdownJson: vatBreakdown,
        paymentBreakdownJson: paymentBreakdown,
        receiptCount,
        invoiceCount,
        guestCount,
        avgTicket,
        cancelCount,
        cancelAmount,
      },
    });

    return NextResponse.json({ ok: true, date: today.toISOString().slice(0, 10) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd raportu dobowego" }, { status: 500 });
  }
}
