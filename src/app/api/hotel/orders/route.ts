export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/hotel/orders — historia zamówień obciążonych na pokoje
 * Query: roomNumber (opcjonalny filtr), dateFrom, dateTo (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomNumberFilter = searchParams.get("roomNumber");
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");

    const dateFrom = dateFromParam ? new Date(dateFromParam + "T00:00:00") : null;
    const dateTo = dateToParam ? new Date(dateToParam + "T23:59:59.999") : null;

    const payments = await prisma.payment.findMany({
      where: {
        method: "ROOM_CHARGE",
        transactionRef: { startsWith: "ROOM-" },
        order: {
          status: "CLOSED",
        },
      },
      include: {
        order: {
          include: {
            items: {
              where: { status: { not: "CANCELLED" } },
              include: {
                product: { select: { name: true } },
              },
            },
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const normalizeRoom = (r: string) => r.replace(/\s+/g, "").trim().toUpperCase();
    const result = payments
      .map((p) => {
        const roomNumber = p.transactionRef?.replace(/^ROOM-/, "").trim() ?? "";
        if (!roomNumber) return null;
        if (roomNumberFilter && normalizeRoom(roomNumber) !== normalizeRoom(roomNumberFilter)) return null;
        if (dateFrom && p.createdAt < dateFrom) return null;
        if (dateTo && p.createdAt > dateTo) return null;

        const order = p.order;
        const items = order.items.map((i) => ({
          productName: i.product.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          note: i.note,
        }));

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          roomNumber,
          amount: Number(p.amount),
          createdAt: p.createdAt.toISOString(),
          waiterName: order.user?.name ?? "",
          items,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return NextResponse.json({ orders: result });
  } catch (e) {
    console.error("[Hotel Orders History]", e);
    return NextResponse.json(
      { error: "Błąd pobierania historii" },
      { status: 500 }
    );
  }
}
