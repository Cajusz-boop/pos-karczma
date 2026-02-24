export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";


/** GET /api/reports/vat?dateFrom=&dateTo= â€” raport VAT miesiÄ™czny (sprzedaĹĽ wg stawek, lista faktur, paragony) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: "Wymagane: dateFrom, dateTo (YYYY-MM-DD)" }, { status: 400 });
    }
    const from = startOfDay(new Date(dateFrom));
    const to = endOfDay(new Date(dateTo));

    const invoices = await prisma.invoice.findMany({
      where: { issueDate: { gte: from, lte: to } },
      orderBy: { issueDate: "asc" },
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        buyerName: true,
        buyerNip: true,
        netTotal: true,
        vatTotal: true,
        grossTotal: true,
        issueDate: true,
        ksefStatus: true,
        ksefRefNumber: true,
      },
    });

    const receipts = await prisma.receipt.findMany({
      where: { order: { status: "CLOSED", closedAt: { gte: from, lte: to } } },
      select: { printedAt: true },
    });
    const receiptsByDay: Record<string, number> = {};
    for (const r of receipts) {
      const d = new Date(r.printedAt).toISOString().slice(0, 10);
      receiptsByDay[d] = (receiptsByDay[d] ?? 0) + 1;
    }

    const vatSummary = invoices.reduce(
      (acc, i) => {
        acc.net += Number(i.netTotal);
        acc.vat += Number(i.vatTotal);
        acc.gross += Number(i.grossTotal);
        acc.count += 1;
        return acc;
      },
      { net: 0, vat: 0, gross: 0, count: 0 }
    );

    return NextResponse.json({
      dateFrom: dateFrom.slice(0, 10),
      dateTo: dateTo.slice(0, 10),
      invoices,
      receiptsByDay: Object.entries(receiptsByDay).map(([date, count]) => ({ date, count })),
      summary: {
        invoiceCount: vatSummary.count,
        totalNet: Math.round(vatSummary.net * 100) / 100,
        totalVat: Math.round(vatSummary.vat * 100) / 100,
        totalGross: Math.round(vatSummary.gross * 100) / 100,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d raportu VAT" }, { status: 500 });
  }
}
