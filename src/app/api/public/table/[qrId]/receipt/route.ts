export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Decimal from "decimal.js";

function getLocaleFromRequest(request: NextRequest): "pl" | "en" {
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  return acceptLanguage.toLowerCase().startsWith("en") ? "en" : "pl";
}

/**
 * GET /api/public/table/[qrId]/receipt
 * Anonimowe pobranie rachunku dla stolika z QR.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrId: string }> }
) {
  try {
    const { qrId } = await params;
    const locale = getLocaleFromRequest(request);

    const table = await prisma.table.findUnique({
      where: { qrId },
      include: { room: { select: { name: true } } },
    });

    if (!table) {
      return NextResponse.json({ error: "TABLE_NOT_FOUND" }, { status: 404 });
    }

    const order = await prisma.order.findFirst({
      where: {
        tableId: table.id,
        status: { notIn: ["CLOSED", "CANCELLED"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
          include: {
            product: { select: { name: true } },
            taxRate: { select: { ratePercent: true, fiscalSymbol: true } },
          },
        },
      },
    });

    if (!order) {
      return new NextResponse(null, { status: 204 });
    }

    let totalPaidOnline = 0;
    let totalLocked = 0;

    const items = order.items.map((i) => {
      const quantity = Number(i.quantity);
      const paidQuantity = Number(i.paidQuantity ?? 0);
      const lockedQuantity = Number(i.lockedQuantity ?? 0);
      const availableQuantity = new Decimal(quantity)
        .minus(paidQuantity)
        .minus(lockedQuantity)
        .toNumber();
      const unitPrice = Number(i.unitPrice);
      const discountAmount = Number(i.discountAmount ?? 0);
      const lineTotal = new Decimal(quantity)
        .times(unitPrice)
        .minus(discountAmount)
        .toNumber();

      totalPaidOnline += new Decimal(paidQuantity).times(unitPrice).minus(
        new Decimal(discountAmount).div(quantity).times(paidQuantity)
      ).toNumber();
      totalLocked += new Decimal(lockedQuantity).times(unitPrice).minus(
        new Decimal(discountAmount).div(quantity).times(lockedQuantity)
      ).toNumber();

      return {
        id: i.id,
        name: i.product.name,
        quantity,
        unitPrice,
        taxRatePercent: Number(i.taxRate.ratePercent),
        fiscalSymbol: i.taxRate.fiscalSymbol,
        discountAmount,
        modifiers: i.modifiersJson
          ? JSON.stringify(i.modifiersJson)
          : null,
        note: i.note,
        paidQuantity,
        lockedQuantity,
        availableQuantity,
        lineTotal,
        status: i.status,
      };
    });

    const totalGross = Number(order.totalGross);
    const totalRemaining = totalGross - totalPaidOnline - totalLocked;

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableName: `${table.room.name} — Stolik ${table.number}`,
      tableNumber: table.number,
      status: order.status,
      onlinePaymentStatus: order.onlinePaymentStatus ?? "UNPAID",
      items,
      totalGross,
      totalPaidOnline,
      totalLocked,
      totalRemaining,
      createdAt: order.createdAt.toISOString(),
      locale,
    });
  } catch (e) {
    console.error("[receipt] GET error:", e);
    return NextResponse.json(
      { error: "Błąd pobierania rachunku" },
      { status: 500 }
    );
  }
}
