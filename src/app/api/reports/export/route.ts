export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { createWorkbook, exportFilename } from "@/lib/export/excel";
import { startOfDay, endOfDay, format, subMonths } from "date-fns";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Gotówka",
  CARD: "Karta",
  BLIK: "Blik",
  TRANSFER: "Przelew",
  VOUCHER: "Voucher",
};

/** GET /api/reports/export?type=daily|monthly|vat|products|warehouse|banquets|audit&date=YYYY-MM-DD lub dateFrom=&dateTo= */
export async function GET(request: NextRequest) {
  try {
    if (process.env.CAPACITOR_BUILD === "1") {
      return NextResponse.json({ error: "Export not available in static build" }, { status: 404 });
    }
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") ?? "daily";
    const date = searchParams.get("date");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let from: Date;
    let to: Date;
    if (type === "daily" && date) {
      from = startOfDay(new Date(date));
      to = endOfDay(new Date(date));
    } else if (dateFrom && dateTo) {
      from = startOfDay(new Date(dateFrom));
      to = endOfDay(new Date(dateTo));
    } else if (type === "monthly" && date) {
      from = startOfDay(new Date(date));
      to = endOfDay(subMonths(from, -1));
    } else {
      const today = new Date();
      from = startOfDay(today);
      to = endOfDay(today);
    }

    const fromStr = format(from, "yyyy-MM-dd");
    const toStr = format(to, "yyyy-MM-dd");

    if (type === "daily") {
      const report = await computeDailyReport(from, to);
      const sheets = [
        {
          name: "Raport dobowy",
          columns: [
            { header: "Data", key: "date", width: 12 },
            { header: "Obrót brutto", key: "totalGross", width: 14 },
            { header: "Obrót netto", key: "totalNet", width: 14 },
            { header: "Paragony", key: "receiptCount", width: 10 },
            { header: "Faktury", key: "invoiceCount", width: 10 },
            { header: "Goście", key: "guestCount", width: 10 },
            { header: "Śr. rachunek", key: "avgTicket", width: 12 },
            { header: "Storna szt.", key: "cancelCount", width: 10 },
            { header: "Storna kwota", key: "cancelAmount", width: 12 },
          ],
          rows: [
            {
              date: report.date,
              totalGross: report.totalGross,
              totalNet: report.totalNet,
              receiptCount: report.receiptCount,
              invoiceCount: report.invoiceCount,
              guestCount: report.guestCount,
              avgTicket: report.avgTicket,
              cancelCount: report.cancelCount,
              cancelAmount: report.cancelAmount,
            },
          ],
        },
        {
          name: "Płatności",
          columns: [
            { header: "Metoda", key: "method", width: 14 },
            { header: "Kwota", key: "amount", width: 14 },
          ],
          rows: Object.entries(report.paymentBreakdownJson).map(([method, amount]) => ({
            method: PAYMENT_LABELS[method] ?? method,
            amount: Number(amount),
          })),
        },
        {
          name: "VAT",
          columns: [
            { header: "Stawka", key: "rate", width: 10 },
            { header: "Netto", key: "net", width: 14 },
            { header: "VAT", key: "vat", width: 14 },
            { header: "Brutto", key: "gross", width: 14 },
          ],
          rows: Object.entries(report.vatBreakdownJson).map(([rate, v]) => ({
            rate,
            net: Number((v as { net: number }).net),
            vat: Number((v as { vat: number }).vat),
            gross: Number((v as { gross: number }).gross),
          })),
        },
      ];
      const buffer = await createWorkbook(sheets);
      const filename = exportFilename("raport_dobowy", fromStr, toStr);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    if (type === "monthly" || type === "vat") {
      const invoices = await prisma.invoice.findMany({
        where: { issueDate: { gte: from, lte: to } },
        orderBy: { issueDate: "asc" },
        select: {
          invoiceNumber: true,
          type: true,
          buyerName: true,
          buyerNip: true,
          netTotal: true,
          vatTotal: true,
          grossTotal: true,
          issueDate: true,
          ksefRefNumber: true,
        },
      });
      const receipts = await prisma.receipt.findMany({
        where: { order: { status: "CLOSED", closedAt: { gte: from, lte: to } } },
        select: { printedAt: true },
      });
      const byDay: Record<string, number> = {};
      for (const r of receipts) {
        const d = format(new Date(r.printedAt), "yyyy-MM-dd");
        byDay[d] = (byDay[d] ?? 0) + 1;
      }
      const receiptSummary = Object.entries(byDay).map(([date, count]) => ({ date, count }));

      const sheets = [
        {
          name: "Faktury",
          columns: [
            { header: "Numer", key: "invoiceNumber", width: 18 },
            { header: "Typ", key: "type", width: 10 },
            { header: "Kontrahent", key: "buyerName", width: 24 },
            { header: "NIP", key: "buyerNip", width: 14 },
            { header: "Netto", key: "netTotal", width: 12 },
            { header: "VAT", key: "vatTotal", width: 12 },
            { header: "Brutto", key: "grossTotal", width: 12 },
            { header: "Data", key: "issueDate", width: 12 },
            { header: "KSeF", key: "ksefRefNumber", width: 20 },
          ],
          rows: invoices.map((i) => ({
            invoiceNumber: i.invoiceNumber,
            type: i.type,
            buyerName: i.buyerName ?? "",
            buyerNip: i.buyerNip ?? "",
            netTotal: Number(i.netTotal),
            vatTotal: Number(i.vatTotal),
            grossTotal: Number(i.grossTotal),
            issueDate: format(new Date(i.issueDate), "yyyy-MM-dd"),
            ksefRefNumber: i.ksefRefNumber ?? "",
          })),
        },
        {
          name: "Paragony",
          columns: [
            { header: "Data", key: "date", width: 12 },
            { header: "Liczba", key: "count", width: 10 },
          ],
          rows: receiptSummary,
        },
      ];
      const buffer = await createWorkbook(sheets);
      const filename = type === "monthly" ? exportFilename("eksport_miesieczny", fromStr, toStr) : exportFilename("vat", fromStr, toStr);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    if (type === "products") {
      const items = await prisma.orderItem.findMany({
        where: {
          status: { not: "CANCELLED" },
          order: { status: "CLOSED", closedAt: { gte: from, lte: to } },
        },
        include: { product: { select: { name: true } }, order: { select: { roomId: true, userId: true } } },
      });
      const byProduct: Record<string, { name: string; qty: number; gross: number }> = {};
      for (const item of items) {
        const id = item.productId;
        if (!byProduct[id]) byProduct[id] = { name: item.product.name, qty: 0, gross: 0 };
        byProduct[id].qty += Number(item.quantity);
        byProduct[id].gross += Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount ?? 0);
      }
      const rows = Object.entries(byProduct)
        .map(([id, v]) => ({ productId: id, name: v.name, qty: Math.round(v.qty * 1000) / 1000, gross: Math.round(v.gross * 100) / 100 }))
        .sort((a, b) => b.gross - a.gross)
        .slice(0, 100);
      const buffer = await createWorkbook([
        {
          name: "Raport produktowy",
          columns: [
            { header: "Produkt", key: "name", width: 32 },
            { header: "Ilość", key: "qty", width: 12 },
            { header: "Obrót brutto", key: "gross", width: 14 },
          ],
          rows,
        },
      ]);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${exportFilename("raport_produktowy", fromStr, toStr)}.xlsx"`,
        },
      });
    }

    if (type === "warehouse") {
      const stockItems = await prisma.stockItem.findMany({
        include: { ingredient: true, warehouse: true },
      });
      const rows = stockItems.map((s) => ({
        warehouse: s.warehouse.name,
        ingredient: s.ingredient.name,
        quantity: Number(s.quantity),
        unit: s.unit,
        minQuantity: Number(s.minQuantity),
      }));
      const buffer = await createWorkbook([
        {
          name: "Stany magazynowe",
          columns: [
            { header: "Magazyn", key: "warehouse", width: 14 },
            { header: "Składnik", key: "ingredient", width: 24 },
            { header: "Ilość", key: "quantity", width: 12 },
            { header: "Jedn.", key: "unit", width: 8 },
            { header: "Min.", key: "minQuantity", width: 10 },
          ],
          rows,
        },
      ]);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${exportFilename("magazyn", fromStr)}.xlsx"`,
        },
      });
    }

    if (type === "banquets") {
      const events = await prisma.banquetEvent.findMany({
        where: { createdAt: { gte: from, lte: to } },
        include: { reservation: true, menu: true },
      });
      const ordersByEvent = await prisma.order.findMany({
        where: { banquetEventId: { in: events.map((e) => e.id) }, status: "CLOSED" },
        include: { payments: true },
      });
      const turnoverByEvent: Record<string, number> = {};
      for (const o of ordersByEvent) {
        if (o.banquetEventId) {
          turnoverByEvent[o.banquetEventId] = (turnoverByEvent[o.banquetEventId] ?? 0) + o.payments.reduce((s, p) => s + Number(p.amount), 0);
        }
      }
      const rows = events.map((e) => ({
        date: format(new Date(e.createdAt), "yyyy-MM-dd"),
        type: e.eventType,
        guests: e.guestCount,
        pricePerPerson: Number(e.pricePerPerson),
        depositPaid: Number(e.depositPaid),
        turnover: Math.round((turnoverByEvent[e.id] ?? 0) * 100) / 100,
      }));
      const buffer = await createWorkbook([
        {
          name: "Bankiety",
          columns: [
            { header: "Data", key: "date", width: 12 },
            { header: "Typ", key: "type", width: 14 },
            { header: "Goście", key: "guests", width: 10 },
            { header: "Cena/os", key: "pricePerPerson", width: 12 },
            { header: "Zaliczka", key: "depositPaid", width: 12 },
            { header: "Obrót", key: "turnover", width: 14 },
          ],
          rows,
        },
      ]);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${exportFilename("bankiety", fromStr, toStr)}.xlsx"`,
        },
      });
    }

    if (type === "audit") {
      const logs = await prisma.auditLog.findMany({
        where: { timestamp: { gte: from, lte: to } },
        orderBy: { timestamp: "desc" },
        take: 500,
        include: { user: { select: { name: true } } },
      });
      const rows = logs.map((l) => ({
        timestamp: format(new Date(l.timestamp), "yyyy-MM-dd HH:mm:ss"),
        user: l.user?.name ?? "",
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId ?? "",
      }));
      const buffer = await createWorkbook([
        {
          name: "Log audytowy",
          columns: [
            { header: "Data i godzina", key: "timestamp", width: 20 },
            { header: "Użytkownik", key: "user", width: 16 },
            { header: "Akcja", key: "action", width: 20 },
            { header: "Encja", key: "entityType", width: 14 },
            { header: "ID", key: "entityId", width: 24 },
          ],
          rows,
        },
      ]);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${exportFilename("audyt", fromStr, toStr)}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ error: "Nieznany typ eksportu" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd eksportu" }, { status: 500 });
  }
}

async function computeDailyReport(dayStart: Date, dayEnd: Date) {
  const closedOrders = await prisma.order.findMany({
    where: { status: "CLOSED", closedAt: { gte: dayStart, lte: dayEnd } },
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
      paymentBreakdown[pay.method] = (paymentBreakdown[pay.method] ?? 0) + Number(pay.amount);
    }
    for (const item of order.items) {
      const gross = Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount ?? 0);
      const rate = Number(item.taxRate.ratePercent);
      const net = gross / (1 + rate / 100);
      totalGross += gross;
      totalNet += net;
      const key = item.taxRate.fiscalSymbol ?? `VAT${rate}`;
      if (!vatByRate[key]) vatByRate[key] = { net: 0, vat: 0, gross: 0 };
      vatByRate[key].net += net;
      vatByRate[key].vat += gross - net;
      vatByRate[key].gross += gross;
    }
  }
  const receiptCount = closedOrders.reduce((s, o) => s + o.receipts.length, 0);
  const invoiceCount = await prisma.invoice.count({
    where: { issueDate: { gte: dayStart, lte: dayEnd } },
  });
  const guestCount = closedOrders.reduce((s, o) => s + o.guestCount, 0);
  const orderCount = closedOrders.length;
  const avgTicket = orderCount > 0 ? totalGross / orderCount : 0;
  const cancelledOrders = await prisma.order.findMany({
    where: { status: "CANCELLED", closedAt: { gte: dayStart, lte: dayEnd } },
    include: { items: { where: { status: "CANCELLED" } } },
  });
  let cancelAmount = 0;
  for (const order of cancelledOrders) {
    for (const item of order.items) {
      cancelAmount += Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount ?? 0);
    }
  }
  return {
    date: format(dayStart, "yyyy-MM-dd"),
    totalGross: Math.round(totalGross * 100) / 100,
    totalNet: Math.round(totalNet * 100) / 100,
    vatBreakdownJson: vatByRate,
    paymentBreakdownJson: paymentBreakdown,
    receiptCount,
    invoiceCount,
    guestCount,
    orderCount,
    avgTicket: Math.round(avgTicket * 100) / 100,
    cancelCount: cancelledOrders.length,
    cancelAmount: Math.round(cancelAmount * 100) / 100,
  };
}
