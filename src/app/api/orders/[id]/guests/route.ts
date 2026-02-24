import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const guestsSchema = z.object({
  guestCount: z.number().int().min(1).max(100),
});

/**
 * PUT /api/orders/[id]/guests - update guest count
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export const dynamic = "force-dynamic";

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
    const parsed = guestsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { guestCount } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, guestCount: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { guestCount },
      select: { id: true, guestCount: true },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_GUESTS_UPDATED", "Order", id, undefined, {
      oldCount: order.guestCount,
      newCount: guestCount,
    });

    return NextResponse.json({
      order: updated,
      message: `Liczba gości: ${guestCount}`,
    });
  } catch (e) {
    console.error("[OrderGuests PUT]", e);
    return NextResponse.json({ error: "Błąd aktualizacji liczby gości" }, { status: 500 });
  }
}

/**
 * GET /api/orders/[id]/guests - get guest count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, guestCount: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    return NextResponse.json({ guestCount: order.guestCount });
  } catch (e) {
    console.error("[OrderGuests GET]", e);
    return NextResponse.json({ error: "Błąd pobierania liczby gości" }, { status: 500 });
  }
}
