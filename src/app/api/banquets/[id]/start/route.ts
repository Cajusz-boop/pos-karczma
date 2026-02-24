export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type MenuItemJson = { productId: string; name: string; quantity: number; courseNumber: number };
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}



export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: banquetEventId } = await params;
    const body = await request.json().catch(() => ({}));
    const { userId } = body as { userId?: string };

    const event = await prisma.banquetEvent.findUnique({
      where: { id: banquetEventId },
      include: {
        menu: true,
        rooms: { take: 1, orderBy: { sortOrder: "asc" } },
        orders: { where: { status: { notIn: ["CLOSED", "CANCELLED"] } } },
      },
    });
    if (!event) return NextResponse.json({ error: "Impreza nie istnieje" }, { status: 404 });
    if (event.status === "CANCELLED") return NextResponse.json({ error: "Impreza anulowana" }, { status: 400 });
    if (event.orders.length > 0) {
      return NextResponse.json({
        ok: true,
        orderId: event.orders[0].id,
        orderNumber: event.orders[0].orderNumber,
        message: "Bankiet już uruchomiony",
      });
    }

    const firstRoom = event.rooms[0];
    if (!firstRoom) return NextResponse.json({ error: "Brak przypisanej sali" }, { status: 400 });
    const uid = userId ?? (await prisma.user.findFirst({ where: { isOwner: true } }))?.id;
    if (!uid) return NextResponse.json({ error: "Brak użytkownika (userId)" }, { status: 400 });

    const guestCount = event.guestCount;
    const items: MenuItemJson[] = event.menu?.itemsJson ? (event.menu.itemsJson as MenuItemJson[]) : [];
    if (items.length === 0) return NextResponse.json({ error: "Menu imprezy nie ma pozycji" }, { status: 400 });

    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { taxRate: true },
    });
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    const maxOrderNumber = await prisma.order.findFirst({ orderBy: { orderNumber: "desc" }, select: { orderNumber: true } });
    const orderNumber = (maxOrderNumber?.orderNumber ?? 0) + 1;

    const order = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.create({
        data: {
          orderNumber,
          roomId: firstRoom.id,
          userId: uid,
          type: "BANQUET",
          guestCount,
          banquetEventId: event.id,
          status: "OPEN",
        },
      });
      for (const it of items) {
        const product = productMap[it.productId];
        if (!product) continue;
        const qty = Number(it.quantity) * guestCount;
        await tx.orderItem.create({
          data: {
            orderId: ord.id,
            productId: product.id,
            quantity: qty,
            unitPrice: product.priceGross,
            taxRateId: product.taxRateId,
            courseNumber: Number(it.courseNumber) || 1,
            status: "ORDERED",
          },
        });
      }
      await tx.banquetEvent.update({
        where: { id: banquetEventId },
        data: { status: "IN_PROGRESS" },
      });
      return ord;
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd uruchamiania bankietu" }, { status: 500 });
  }
}
