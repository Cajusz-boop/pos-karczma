export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/receipt/confirm/[token]
 * Trwały link do potwierdzenia płatności — zwraca dane e-paragonu.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const receipt = await prisma.receipt.findUnique({
      where: { token },
      include: {
        order: {
          include: {
            items: {
              where: { status: { not: "CANCELLED" } },
              include: {
                product: { select: { name: true } },
                taxRate: { select: { ratePercent: true, fiscalSymbol: true } },
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    if (receipt.expiresAt && receipt.expiresAt < new Date()) {
      return NextResponse.json({ error: "EXPIRED" }, { status: 410 });
    }

    if (!receipt.viewedAt) {
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { viewedAt: new Date() },
      });
    }

    const items = receipt.order.items.map((i) => ({
      id: i.id,
      name: i.product.name,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      taxRatePercent: Number(i.taxRate.ratePercent),
      fiscalSymbol: i.taxRate.fiscalSymbol,
      lineTotal: Number(i.quantity) * Number(i.unitPrice) - Number(i.discountAmount ?? 0),
    }));

    return NextResponse.json({
      htmlContent: receipt.htmlContent,
      fiscalNumber: receipt.fiscalNumber,
      paidAt: receipt.printedAt?.toISOString(),
      orderNumber: receipt.order.orderNumber,
      items,
      total: Number(receipt.order.totalGross),
    });
  } catch (e) {
    console.error("[receipt/confirm] GET error:", e);
    return NextResponse.json(
      { error: "Błąd pobierania potwierdzenia" },
      { status: 500 }
    );
  }
}
