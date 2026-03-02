export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, sendOrderSchema } from "@/lib/validation";
import { recalculateOrderCache } from "@/lib/pos/order-cache";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { data, error: valError } = await parseBody(request, sendOrderSchema);
    if (valError) return valError;
    const { items } = data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    const now = new Date();

    const sentIds = new Set<string>();
    await prisma.$transaction(async (tx) => {
      for (const it of items) {
        if (it.id) {
          const existing = order.items.find((i) => i.id === it.id);
          if (existing && existing.status === "ORDERED") {
            await tx.orderItem.update({
              where: { id: it.id },
              data: {
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                modifiersJson: it.modifiersJson ?? undefined,
                note: it.note ?? null,
                courseNumber: it.courseNumber ?? 1,
                status: "SENT",
                sentToKitchenAt: now,
              },
            });
            sentIds.add(it.id);
          }
        } else {
          const created = await tx.orderItem.create({
            data: {
              orderId,
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              taxRateId: it.taxRateId,
              modifiersJson: it.modifiersJson ?? undefined,
              note: it.note ?? null,
              courseNumber: it.courseNumber ?? 1,
              status: "SENT",
              sentToKitchenAt: now,
            },
          });
          sentIds.add(created.id);
        }
      }
      const toCancel = order.items.filter(
        (i) => i.status === "ORDERED" && !sentIds.has(i.id)
      );
      for (const item of toCancel) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: { status: "CANCELLED", cancelledAt: now },
        });
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: "SENT_TO_KITCHEN" },
      });
      
      // Przelicz cache zamówienia
      await recalculateOrderCache(orderId, tx);
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd wysyłania do kuchni" },
      { status: 500 }
    );
  }
}
