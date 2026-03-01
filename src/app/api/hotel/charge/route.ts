export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postRoomCharge } from "@/lib/hotel/client";
import { auditLog } from "@/lib/audit";
import { syncHotelGuest } from "@/lib/hotel/sync";
import { z } from "zod";

const chargeSchema = z.object({
  roomNumber: z.string().min(1, "Wymagany numer pokoju"),
  orderId: z.string().min(1, "Wymagany orderId"),
  guestName: z.string().optional(),
  guestId: z.string().optional(),
  guestPhone: z.string().optional(),
  guestEmail: z.string().optional(),
});

/**
 * POST /api/hotel/charge — proxy to hotel system, posts room charge
 * Body: { roomNumber, orderId, guestName? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = chargeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }
    const { roomNumber, orderId, guestName, guestId, guestPhone, guestEmail } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
          include: {
            product: {
              select: {
                name: true,
                category: { select: { name: true } },
              },
            },
          },
        },
        user: { select: { name: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    if (order.status === "CLOSED") {
      return NextResponse.json({ error: "Zamówienie jest już zamknięte" }, { status: 400 });
    }

    const totalGross = order.items.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice) - Number(i.discountAmount ?? 0),
      0
    );

    // Apply order-level discount
    let discountAmount = 0;
    if (order.discountJson && typeof order.discountJson === "object") {
      const d = order.discountJson as { type?: string; value?: number };
      if (d.type === "PERCENT" && typeof d.value === "number") {
        discountAmount = (totalGross * d.value) / 100;
      } else if (d.type === "AMOUNT" && typeof d.value === "number") {
        discountAmount = d.value;
      }
    }
    const finalTotal = Math.round((totalGross - discountAmount) * 100) / 100;

    const description = guestName
      ? `Restauracja — zam. #${order.orderNumber} (${guestName})`
      : `Restauracja — zamówienie #${order.orderNumber}`;

    // Build items list for HotelSystem
    const hotelItems = order.items.map((item) => ({
      name: item.product.name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      category: item.product.category?.name,
    }));

    const result = await postRoomCharge({
      roomNumber,
      amount: finalTotal,
      description,
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: hotelItems,
      cashierName: order.user?.name,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "HOTEL_ROOM_CHARGE", "Order", orderId, undefined, {
      roomNumber,
      guestName,
      amount: finalTotal,
      status: result.status,
    });

    if (result.status === "FAILED") {
      return NextResponse.json(
        { error: "Nie udało się obciążyć pokoju", charge: result },
        { status: 502 }
      );
    }

    // Handle unassigned charge warning (charge was saved but no active reservation)
    const unassignedWarning = result.unassigned
      ? { unassigned: true, reason: result.reason ?? "Brak aktywnej rezerwacji" }
      : undefined;

    // Sync hotel guest to POS Customer
    let customerId: string | undefined;
    if (guestId || guestName) {
      try {
        customerId = await syncHotelGuest({
          guestId: guestId || `room-${roomNumber}-${Date.now()}`,
          guestName: guestName || "",
          roomNumber,
          phone: guestPhone,
          email: guestEmail,
        });
        // Link customer to order if not already linked
        if (customerId && !order.customerId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { customerId },
          });
        }
      } catch (syncErr) {
        console.error("[Hotel Guest Sync]", syncErr);
      }
    }

    return NextResponse.json({ charge: result, customerId, ...unassignedWarning });
  } catch (e) {
    console.error("[Hotel Charge Proxy]", e);
    return NextResponse.json(
      { error: "Błąd obciążenia pokoju" },
      { status: 500 }
    );
  }
}
