export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { nextInvoiceNumber, getPrefixForType } from "@/lib/invoice-number";
import { sendInvoiceToKsef } from "@/lib/ksef";
import { parseBody, createInvoiceSchema } from "@/lib/validation";


function computeNetFromGross(gross: number, ratePercent: number): number {
  return gross / (1 + ratePercent / 100);
}

/** GET /api/invoices "” rejestr faktur (filtr: type, dateFrom, dateTo, ksefStatus) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const ksefStatus = searchParams.get("ksefStatus");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (ksefStatus) where.ksefStatus = ksefStatus;
    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) (where.issueDate as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) {
        const d = new Date(dateTo);
        d.setHours(23, 59, 59, 999);
        (where.issueDate as Record<string, Date>).lte = d;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { issueDate: "desc" },
      take: 200,
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
        ksefErrorMessage: true,
      },
    });
    return NextResponse.json(invoices);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd listy faktur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, createInvoiceSchema);
    if (valError) return valError;
    const { orderId, buyerNip, buyerName, buyerAddress } = data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
          include: {
            product: { select: { name: true } },
            taxRate: { select: { ratePercent: true } },
          },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    const discount = order.discountJson as { type?: string; value?: number } | null;
    let discountValue = 0;
    if (discount?.type === "PERCENT" && typeof discount.value === "number") {
      const grossSum = order.items.reduce(
        (s, i) => s + Number(i.quantity) * Number(i.unitPrice),
        0
      );
      discountValue = (grossSum * discount.value) / 100;
    } else if (discount?.type === "AMOUNT" && typeof discount.value === "number") {
      discountValue = discount.value;
    }
    const grossBeforeDiscount = order.items.reduce(
      (s, i) => s + Number(i.quantity) * Number(i.unitPrice),
      0
    );
    const grossTotal = Math.max(0, grossBeforeDiscount - discountValue);
    const discountRatio = grossBeforeDiscount > 0 ? 1 - discountValue / grossBeforeDiscount : 1;

    const itemsJson = order.items.map((i) => {
      const qty = Number(i.quantity);
      const unitGross = Number(i.unitPrice) * discountRatio;
      const lineGross = qty * unitGross;
      const rate = Number(i.taxRate.ratePercent);
      const netPrice = computeNetFromGross(unitGross, rate);
      const netAmount = qty * netPrice;
      const vatAmount = lineGross - netAmount;
      return {
        name: i.product.name,
        qty,
        unitPrice: unitGross,
        netPrice,
        vatRate: rate,
        vatAmount,
        grossPrice: lineGross,
      };
    });

    const netTotal = itemsJson.reduce((s, i) => s + i.netPrice * i.qty, 0);
    const vatTotal = itemsJson.reduce((s, i) => s + i.vatAmount, 0);

    const now = new Date();
    const invoiceNumber = await nextInvoiceNumber(getPrefixForType("STANDARD"));

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        type: "STANDARD",
        orderId,
        buyerNip: buyerNip ?? null,
        buyerName: buyerName ?? null,
        buyerAddress: buyerAddress ?? null,
        itemsJson: itemsJson as object,
        netTotal,
        vatTotal,
        grossTotal,
        saleDate: order.closedAt ?? now,
        issueDate: now,
        dueDate: addDays(now, 14),
        ksefStatus: "PENDING",
      },
    });

    const ksefResult = await sendInvoiceToKsef(invoice.id);
    if (ksefResult.sent) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          ksefStatus: ksefResult.status,
          ksefRefNumber: ksefResult.refNumber ?? undefined,
          ksefErrorMessage: ksefResult.errorMessage ?? undefined,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      ksefStatus: ksefResult.sent ? ksefResult.status : "PENDING",
      ksefRefNumber: ksefResult.refNumber ?? undefined,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia faktury" }, { status: 500 });
  }
}
