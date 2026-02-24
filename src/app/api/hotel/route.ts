import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOccupiedRooms, postRoomCharge } from "@/lib/hotel/client";
import { auditLog } from "@/lib/audit";

/**
 * GET /api/hotel — list occupied hotel rooms
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getOccupiedRooms();
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ rooms: [], error: "Błąd integracji hotelowej" });
  }
}

/**
 * POST /api/hotel — post room charge
 * Body: { roomNumber, orderId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomNumber, orderId } = body as { roomNumber?: string; orderId?: string };

    if (!roomNumber || !orderId) {
      return NextResponse.json({ error: "Wymagane: roomNumber, orderId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
          select: { quantity: true, unitPrice: true, discountAmount: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    const totalGross = order.items.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice) - Number(i.discountAmount ?? 0),
      0
    );

    const result = await postRoomCharge({
      roomNumber,
      amount: Math.round(totalGross * 100) / 100,
      description: `Restauracja — zamówienie #${order.orderNumber}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "HOTEL_ROOM_CHARGE", "Order", orderId, undefined, {
      roomNumber,
      amount: totalGross,
      status: result.status,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd obciążenia pokoju" }, { status: 500 });
  }
}

/**
 * PUT /api/hotel — update hotel integration config
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    await prisma.systemConfig.upsert({
      where: { key: "hotel_integration" },
      create: { key: "hotel_integration", value: body as object },
      update: { value: body as object },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zapisu konfiguracji" }, { status: 500 });
  }
}
