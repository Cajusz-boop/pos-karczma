import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const limitSchema = z.object({
  maxTotal: z.number().min(0).nullable(),
});

/**
 * PUT /api/orders/[id]/limit - set order spending limit
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = limitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { maxTotal } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, maxTotal: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { maxTotal },
      select: { id: true, maxTotal: true },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_LIMIT_SET", "Order", id, undefined, {
      oldLimit: order.maxTotal ? Number(order.maxTotal) : null,
      newLimit: maxTotal,
    });

    return NextResponse.json({
      order: {
        id: updated.id,
        maxTotal: updated.maxTotal ? Number(updated.maxTotal) : null,
      },
      message: maxTotal ? `Limit zamówienia: ${maxTotal.toFixed(2)} zł` : "Limit usunięty",
    });
  } catch (e) {
    console.error("[OrderLimit PUT]", e);
    return NextResponse.json({ error: "Błąd ustawiania limitu" }, { status: 500 });
  }
}

/**
 * GET /api/orders/[id]/limit - check order limit status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        maxTotal: true,
        items: {
          where: { status: { not: "CANCELLED" } },
          select: {
            quantity: true,
            unitPrice: true,
            discountAmount: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    const currentTotal = order.items.reduce((sum, item) => {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount);
      return sum + itemTotal;
    }, 0);

    const maxTotal = order.maxTotal ? Number(order.maxTotal) : null;
    const remaining = maxTotal ? maxTotal - currentTotal : null;
    const isOverLimit = maxTotal !== null && currentTotal > maxTotal;

    return NextResponse.json({
      maxTotal,
      currentTotal,
      remaining,
      isOverLimit,
    });
  } catch (e) {
    console.error("[OrderLimit GET]", e);
    return NextResponse.json({ error: "Błąd pobierania limitu" }, { status: 500 });
  }
}

/**
 * DELETE /api/orders/[id]/limit - remove order limit
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.order.update({
      where: { id },
      data: { maxTotal: null },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_LIMIT_REMOVED", "Order", id);

    return NextResponse.json({ message: "Limit usunięty" });
  } catch (e) {
    console.error("[OrderLimit DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania limitu" }, { status: 500 });
  }
}
