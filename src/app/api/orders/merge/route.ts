export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { parseBody, mergeOrdersSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, mergeOrdersSchema);
    if (valError) return valError;
    const { orderIds, leadingUserId } = data;

    const uniqueIds = Array.from(new Set(orderIds));
    const orders = await prisma.order.findMany({
      where: { id: { in: uniqueIds } },
      include: { items: true, table: true },
    });

    if (orders.length !== uniqueIds.length) {
      return NextResponse.json({ error: "Nie znaleziono wszystkich zamówień" }, { status: 404 });
    }
    const closedOrCancelled = orders.filter((o) => o.status === "CLOSED" || o.status === "CANCELLED");
    if (closedOrCancelled.length > 0) {
      return NextResponse.json(
        { error: "Nie można łączyć zamówień zamkniętych lub anulowanych" },
        { status: 400 }
      );
    }

    const [targetOrder, ...toMerge] = orders;
    const targetId = targetOrder.id;
    const tableIdsToFree = toMerge.map((o) => o.tableId).filter(Boolean) as string[];

    await prisma.$transaction(async (tx) => {
      for (const order of toMerge) {
        await tx.orderItem.updateMany({
          where: { orderId: order.id },
          data: { orderId: targetId },
        });
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
      }
      for (const tid of tableIdsToFree) {
        if (tid !== targetOrder.tableId) {
          await tx.table.update({
            where: { id: tid },
            data: { status: "FREE" },
          });
        }
      }
      if (leadingUserId) {
        await tx.order.update({
          where: { id: targetId },
          data: { userId: leadingUserId },
        });
      }
    });

    await auditLog(null, "ORDERS_MERGED", "Order", targetId, { mergedOrderIds: toMerge.map((o) => o.id) }, { leadingUserId: leadingUserId ?? null });
    return NextResponse.json({ ok: true, targetOrderId: targetId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd łączenia zamówień" }, { status: 500 });
  }
}
