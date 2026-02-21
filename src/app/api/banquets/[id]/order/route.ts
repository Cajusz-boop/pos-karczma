import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: banquetEventId } = await params;
    const event = await prisma.banquetEvent.findUnique({
      where: { id: banquetEventId },
      include: {
        orders: { where: { status: { notIn: ["CLOSED", "CANCELLED"] } }, take: 1, orderBy: { createdAt: "desc" } },
      },
    });
    if (!event) return NextResponse.json({ error: "Impreza nie istnieje" }, { status: 404 });
    const order = event.orders[0];
    if (!order) return NextResponse.json({ orderId: null, orderNumber: null });
    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania zamówienia bankietu" }, { status: 500 });
  }
}
