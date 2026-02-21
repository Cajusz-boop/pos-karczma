import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { parseBody, splitOrderSchema } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { data, error: valError } = await parseBody(request, splitOrderSchema);
    if (valError) return valError;
    const { itemIdsForNewOrder, targetTableId } = data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, table: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }
    if (order.status === "CLOSED" || order.status === "CANCELLED") {
      return NextResponse.json({ error: "Nie można dzielić tego zamówienia" }, { status: 400 });
    }

    const itemsToMove = order.items.filter(
      (i) => itemIdsForNewOrder.includes(i.id) && i.status !== "CANCELLED"
    );
    if (itemsToMove.length === 0) {
      return NextResponse.json({ error: "Brak pozycji do przeniesienia" }, { status: 400 });
    }
    if (itemsToMove.length === order.items.filter((i) => i.status !== "CANCELLED").length) {
      return NextResponse.json(
        { error: "Zostaw co najmniej jedną pozycję w bieżącym zamówieniu" },
        { status: 400 }
      );
    }

    const newTableId = targetTableId ?? order.tableId;
    const newRoomId = order.roomId!;

    if (targetTableId && targetTableId !== order.tableId) {
      const targetTable = await prisma.table.findUnique({
        where: { id: targetTableId },
        include: { orders: { where: { status: { notIn: ["CLOSED", "CANCELLED"] } } } },
      });
      if (!targetTable) {
        return NextResponse.json({ error: "Docelowy stolik nie istnieje" }, { status: 404 });
      }
      if (targetTable.orders.length > 0) {
        return NextResponse.json(
          { error: "Docelowy stolik jest zajęty. Wybierz wolny stolik." },
          { status: 400 }
        );
      }
    }

    const maxOrder = await prisma.order.aggregate({ _max: { orderNumber: true } });
    const nextOrderNumber = (maxOrder._max.orderNumber ?? 0) + 1;

    const newOrder = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          tableId: newTableId,
          roomId: newRoomId,
          userId: order.userId,
          orderNumber: nextOrderNumber,
          status: "OPEN",
          type: order.type,
          guestCount: 1,
        },
      });
      for (const item of itemsToMove) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: { orderId: created.id },
        });
      }
      if (targetTableId && targetTableId !== order.tableId) {
        await tx.table.update({
          where: { id: targetTableId },
          data: { status: "OCCUPIED" },
        });
      }
      return created;
    });

    await auditLog(null, "ORDER_SPLIT", "Order", orderId, {}, { newOrderId: newOrder.id, movedItemIds: itemsToMove.map((i) => i.id) });
    return NextResponse.json({ ok: true, newOrderId: newOrder.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd podziału zamówienia" }, { status: 500 });
  }
}
