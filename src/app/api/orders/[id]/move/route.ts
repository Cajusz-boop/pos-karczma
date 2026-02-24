export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { parseBody, moveOrderSchema } from "@/lib/validation";
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}



export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { data, error: valError } = await parseBody(request, moveOrderSchema);
    if (valError) return valError;
    const { targetTableId, mergeIfOccupied } = data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }
    if (order.status === "CLOSED" || order.status === "CANCELLED") {
      return NextResponse.json({ error: "Nie można przenieść tego zamówienia" }, { status: 400 });
    }

    const targetTable = await prisma.table.findUnique({
      where: { id: targetTableId },
      include: { orders: { where: { status: { notIn: ["CLOSED", "CANCELLED"] } } } },
    });
    if (!targetTable) {
      return NextResponse.json({ error: "Docelowy stolik nie istnieje" }, { status: 404 });
    }

    const targetOrder = targetTable.orders[0] ?? null;

    if (targetOrder && targetOrder.id !== orderId) {
      if (mergeIfOccupied) {
        await prisma.$transaction(async (tx) => {
          await tx.orderItem.updateMany({
            where: { orderId },
            data: { orderId: targetOrder.id },
          });
          await tx.order.update({
            where: { id: orderId },
            data: { status: "CANCELLED" },
          });
          if (order.tableId) {
            await tx.table.update({
              where: { id: order.tableId },
              data: { status: "FREE" },
            });
          }
        });
        await auditLog(null, "ORDER_MERGED_ON_MOVE", "Order", orderId, { tableId: order.tableId }, { mergedInto: targetOrder.id });
        return NextResponse.json({ ok: true, merged: true, targetOrderId: targetOrder.id });
      }
      return NextResponse.json(
        { error: "Docelowy stolik jest zajęty. Użyj opcji „Połącz z zamówieniem”." },
        { status: 400 }
      );
    }

    if (targetTableId === order.tableId) {
      return NextResponse.json({ ok: true });
    }

    await prisma.$transaction(async (tx) => {
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "FREE" },
        });
      }
      await tx.order.update({
        where: { id: orderId },
        data: { tableId: targetTableId, roomId: targetTable.roomId },
      });
      await tx.table.update({
        where: { id: targetTableId },
        data: { status: "OCCUPIED" },
      });
    });

    await auditLog(null, "ORDER_MOVED", "Order", orderId, { tableId: order.tableId }, { tableId: targetTableId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd przenoszenia zamówienia" }, { status: 500 });
  }
}
