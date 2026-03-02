export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { nextInvoiceNumber, getPrefixForType } from "@/lib/invoice-number";
import { z } from "zod";
import { parseBody } from "@/lib/validation";

const correctionSchema = z.object({
  correctionReason: z.string().min(1, "Wymagany powód korekty").max(500),
  correctedItems: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number(),
    unitPrice: z.number(),
    netPrice: z.number(),
    vatRate: z.number(),
    vatAmount: z.number(),
    grossPrice: z.number(),
  })).min(1, "Wymagana co najmniej 1 pozycja"),
  buyerNip: z.string().optional(),
  buyerName: z.string().optional(),
  buyerAddress: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/invoices/[id]/correction — create correction invoice
 */

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const originalInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!originalInvoice) {
      return NextResponse.json({ error: "Faktura oryginalna nie istnieje" }, { status: 404 });
    }

    if (originalInvoice.type === "CORRECTION") {
      return NextResponse.json(
        { error: "Nie można korygować faktury korygującej" },
        { status: 400 }
      );
    }

    const { data, error: valError } = await parseBody(request, correctionSchema);
    if (valError) return valError;

    // Calculate totals for correction
    let netTotal = 0;
    let vatTotal = 0;
    let grossTotal = 0;

    for (const item of data.correctedItems) {
      netTotal += item.netPrice;
      vatTotal += item.vatAmount;
      grossTotal += item.grossPrice;
    }

    // Generate correction invoice number
    const prefix = getPrefixForType("CORRECTION");
    const invoiceNumber = await nextInvoiceNumber(prefix);

    const correctionInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        type: "CORRECTION",
        orderId: originalInvoice.orderId,
        banquetEventId: originalInvoice.banquetEventId,
        buyerNip: data.buyerNip ?? originalInvoice.buyerNip,
        buyerName: data.buyerName ?? originalInvoice.buyerName,
        buyerAddress: data.buyerAddress ?? originalInvoice.buyerAddress,
        itemsJson: data.correctedItems,
        netTotal: Math.round(netTotal * 100) / 100,
        vatTotal: Math.round(vatTotal * 100) / 100,
        grossTotal: Math.round(grossTotal * 100) / 100,
        paymentMethod: originalInvoice.paymentMethod,
        saleDate: originalInvoice.saleDate,
        relatedInvoiceId: originalInvoice.id,
        correctionReason: data.correctionReason,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "INVOICE_CORRECTION", "Invoice", correctionInvoice.id, {
      originalInvoiceId: originalInvoice.id,
      originalInvoiceNumber: originalInvoice.invoiceNumber,
      originalGrossTotal: Number(originalInvoice.grossTotal),
    }, {
      correctionInvoiceNumber: invoiceNumber,
      correctionReason: data.correctionReason,
      grossTotal: Math.round(grossTotal * 100) / 100,
    });

    return NextResponse.json({
      id: correctionInvoice.id,
      invoiceNumber: correctionInvoice.invoiceNumber,
      type: correctionInvoice.type,
      originalInvoiceId: originalInvoice.id,
      originalInvoiceNumber: originalInvoice.invoiceNumber,
      correctionReason: correctionInvoice.correctionReason,
      netTotal: Number(correctionInvoice.netTotal),
      vatTotal: Number(correctionInvoice.vatTotal),
      grossTotal: Number(correctionInvoice.grossTotal),
      createdAt: correctionInvoice.createdAt.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia korekty faktury" }, { status: 500 });
  }
}
