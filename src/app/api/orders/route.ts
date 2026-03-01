export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createOrderSchema } from "@/lib/validation";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limitParam = searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam ?? "50", 10) || 50, 1), 100);
    const isHistoryView = limitParam != null && limitParam !== "";

    // Simple format for POS (order picker) when status=open and no history view
    if (status === "open" && !isHistoryView) {
      const orders = await prisma.order.findMany({
        where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
        include: { table: { select: { id: true, number: true } }, user: { select: { name: true } } },
        orderBy: { orderNumber: "asc" },
      });
      return NextResponse.json(
        orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          tableId: o.tableId,
          tableNumber: o.table?.number,
          userName: o.user.name,
        }))
      );
    }

    // History: status = open | closed | cancelled | all (default), last N orders
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let where: any = {};
    if (status === "open") where = { status: { notIn: ["CLOSED", "CANCELLED"] } };
    else if (status === "closed") where = { status: "CLOSED" };
    else if (status === "cancelled") where = { status: "CANCELLED" };

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: { select: { number: true } },
        room: { select: { name: true } },
        user: { select: { name: true } },
        items: {
          where: { status: { not: "CANCELLED" as const } },
          select: {
            quantity: true,
            unitPrice: true,
            discountAmount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const result = orders.map((o: { id: string; orderNumber: number; table: { number: number } | null; room: { name: string } | null; user: { name: string }; status: string; items: Array<{ quantity: unknown; unitPrice: unknown; discountAmount: unknown }>; createdAt: Date; closedAt: Date | null }) => {
      const total = o.items.reduce(
        (sum: number, i: { quantity: unknown; unitPrice: unknown; discountAmount: unknown }) =>
          sum +
          Number(i.quantity) * Number(i.unitPrice) -
          Number(i.discountAmount ?? 0),
        0
      );
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        tableNumber: o.table?.number ?? null,
        tableName: o.table ? `Stolik #${o.table.number}` : o.room?.name ?? "â€”",
        waiterName: o.user.name,
        status: o.status,
        total: Math.round(total * 100) / 100,
        createdAt: o.createdAt.toISOString(),
        closedAt: o.closedAt?.toISOString() ?? null,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d listy zamĂłwieĹ„" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, createOrderSchema);
    if (valError) return valError;
    const { tableId, roomId, userId, guestCount, type } = data;
    const orderType = type ?? (tableId ? "DINE_IN" : "TAKEAWAY");

    const maxOrder = await prisma.order.aggregate({
      _max: { orderNumber: true },
    });
    const nextOrderNumber = (maxOrder._max.orderNumber ?? 0) + 1;

    // Takeaway order â€” no table required
    if (orderType === "TAKEAWAY" || orderType === "HOTEL_ROOM" || !tableId) {
      const finalType = orderType === "HOTEL_ROOM" ? "HOTEL_ROOM" : "TAKEAWAY";
      const order = await prisma.order.create({
        data: {
          tableId: null,
          roomId: null,
          userId,
          guestCount: Math.floor(guestCount),
          orderNumber: nextOrderNumber,
          status: "OPEN",
          type: finalType,
        },
      });
      return NextResponse.json({ order: { id: order.id, orderNumber: order.orderNumber, type: finalType } });
    }

    // Dine-in order â€” table required
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { orders: { where: { status: { notIn: ["CLOSED", "CANCELLED"] } } } },
    });
    if (!table) {
      return NextResponse.json({ error: "Stolik nie istnieje" }, { status: 404 });
    }
    if (roomId && table.roomId !== roomId) {
      return NextResponse.json({ error: "Stolik nie naleĹĽy do tej sali" }, { status: 400 });
    }
    if (table.status !== "FREE") {
      return NextResponse.json(
        { error: "Stolik jest juĹĽ zajÄ™ty" },
        { status: 400 }
      );
    }

    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          tableId,
          roomId: roomId ?? table.roomId,
          userId,
          guestCount: Math.floor(guestCount),
          orderNumber: nextOrderNumber,
          status: "OPEN",
          type: orderType,
        },
      }),
      prisma.table.update({
        where: { id: tableId },
        data: { status: "OCCUPIED", assignedUser: userId },
      }),
    ]);

    return NextResponse.json({ order: { id: order.id, orderNumber: order.orderNumber, type: orderType } });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "BĹ‚Ä…d tworzenia zamĂłwienia" },
      { status: 500 }
    );
  }
}
