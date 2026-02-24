export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const delaySchema = z.object({
  delayMinutes: z.number().int().min(1).max(120),
});

/**
 * POST /api/orders/[id]/items/[itemId]/delay - set delay timer for item
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_","itemId":"_"} ];
}


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;
    const body = await request.json();
    const parsed = delaySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { delayMinutes } = parsed.data;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        product: { select: { name: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    if (item.orderId !== orderId) {
      return NextResponse.json({ error: "Pozycja nie należy do tego zamówienia" }, { status: 400 });
    }

    if (item.status === "READY" || item.status === "SERVED" || item.status === "CANCELLED") {
      return NextResponse.json({ error: "Nie można ustawić minutnika dla tej pozycji" }, { status: 400 });
    }

    const fireAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        delayMinutes,
        fireAt,
        isFire: false,
        firedAt: null,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_ITEM_DELAY_SET", "OrderItem", itemId, undefined, {
      orderId,
      delayMinutes,
      fireAt: fireAt.toISOString(),
      productName: item.product.name,
    });

    return NextResponse.json({
      item: {
        id: updated.id,
        delayMinutes: updated.delayMinutes,
        fireAt: updated.fireAt?.toISOString(),
      },
    });
  } catch (e) {
    console.error("[Delay POST]", e);
    return NextResponse.json({ error: "Błąd ustawienia minutnika" }, { status: 500 });
  }
}

/**
 * DELETE /api/orders/[id]/items/[itemId]/delay - remove delay timer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.orderId !== orderId) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        delayMinutes: null,
        fireAt: null,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_ITEM_DELAY_CLEARED", "OrderItem", itemId);

    return NextResponse.json({
      item: {
        id: updated.id,
        delayMinutes: null,
        fireAt: null,
      },
    });
  } catch (e) {
    console.error("[Delay DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania minutnika" }, { status: 500 });
  }
}
