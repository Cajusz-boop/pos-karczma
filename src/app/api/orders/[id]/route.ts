export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}



export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { discountJson } = body as { discountJson?: { type: string; value: number; reason?: string; authorizedBy?: string } };

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }
    if (order.status === "CLOSED") {
      return NextResponse.json({ error: "Zamówienie już zamknięte" }, { status: 400 });
    }

    const oldDiscount = order.discountJson as object | null;
    await prisma.order.update({
      where: { id },
      data: { discountJson: discountJson != null ? (discountJson as object) : undefined },
    });
    if (discountJson && (oldDiscount === null || JSON.stringify(oldDiscount) !== JSON.stringify(discountJson))) {
      await auditLog(null, "DISCOUNT_APPLIED", "Order", id, oldDiscount ?? undefined, discountJson);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji zamówienia" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: { select: { number: true } },
        user: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true } },
            taxRate: { select: { id: true, ratePercent: true, fiscalSymbol: true } },
          },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }
    const items = order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      taxRateId: i.taxRateId,
      taxRatePercent: Number(i.taxRate.ratePercent),
      taxRateSymbol: i.taxRate.fiscalSymbol,
      modifiersJson: i.modifiersJson,
      note: i.note,
      courseNumber: i.courseNumber,
      status: i.status,
      sentToKitchenAt: i.sentToKitchenAt,
    }));
    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.table?.number,
      tableId: order.tableId,
      userName: order.user.name,
      userId: order.userId,
      guestCount: order.guestCount,
      status: order.status,
      type: order.type,
      courseReleasedUpTo: order.courseReleasedUpTo,
      discountJson: order.discountJson,
      items,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd pobierania zamówienia" },
      { status: 500 }
    );
  }
}
