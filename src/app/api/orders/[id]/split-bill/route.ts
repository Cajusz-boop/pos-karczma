export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const splitBillSchema = z.object({
  numberOfPeople: z.number().int().min(2, "Minimum 2 osoby").max(20, "Maksymalnie 20 osób"),
});

/**
 * POST /api/orders/[id]/split-bill — split bill equally among N people
 * Creates N-1 new orders (copies of original), each with proportional items.
 * Returns array of split order IDs with amounts.
 */
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
    const body = await request.json();
    const parsed = splitBillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { numberOfPeople } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
          include: { taxRate: true },
        },
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    if (order.status === "CLOSED") {
      return NextResponse.json({ error: "Zamówienie jest już zamknięte" }, { status: 400 });
    }

    if (order.payments.length > 0) {
      return NextResponse.json({ error: "Zamówienie ma już płatności — nie można podzielić" }, { status: 400 });
    }

    // Calculate total
    const totalGross = order.items.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice) - Number(i.discountAmount ?? 0),
      0
    );

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
    const perPerson = Math.round((finalTotal / numberOfPeople) * 100) / 100;
    const remainder = Math.round((finalTotal - perPerson * numberOfPeople) * 100) / 100;

    // Get next order numbers
    const maxOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    let nextOrderNumber = (maxOrder?.orderNumber ?? 0) + 1;

    // Create split orders in a transaction
    const splitOrders = await prisma.$transaction(async (tx) => {
      const results: { id: string; orderNumber: number; amount: number; personIndex: number }[] = [];

      // First person keeps the original order but with adjusted discount
      // to make their portion = perPerson + remainder
      results.push({
        id: order.id,
        orderNumber: order.orderNumber,
        amount: perPerson + remainder,
        personIndex: 1,
      });

      // Create N-1 new orders for the remaining people
      for (let i = 2; i <= numberOfPeople; i++) {
        const newOrder = await tx.order.create({
          data: {
            orderNumber: nextOrderNumber++,
            tableId: order.tableId,
            roomId: order.roomId,
            userId: order.userId,
            customerId: order.customerId,
            status: "OPEN",
            type: order.type,
            guestCount: 1,
            note: `Podział rachunku #${order.orderNumber} — osoba ${i}/${numberOfPeople}`,
            discountJson: order.discountJson ?? undefined,
          },
        });

        // Copy items proportionally (each split gets 1/N of each item)
        for (const item of order.items) {
          const splitQty = Number(item.quantity) / numberOfPeople;
          if (splitQty > 0) {
            await tx.orderItem.create({
              data: {
                orderId: newOrder.id,
                productId: item.productId,
                quantity: Math.round(splitQty * 1000) / 1000,
                unitPrice: Number(item.unitPrice),
                taxRateId: item.taxRateId,
                discountAmount: Math.round((Number(item.discountAmount ?? 0) / numberOfPeople) * 100) / 100,
                modifiersJson: item.modifiersJson ?? undefined,
                note: item.note,
                courseNumber: item.courseNumber,
                status: "SERVED",
              },
            });
          }
        }

        results.push({
          id: newOrder.id,
          orderNumber: newOrder.orderNumber,
          amount: perPerson,
          personIndex: i,
        });
      }

      // Update original order items to reflect 1/N quantity
      for (const item of order.items) {
        const splitQty = Number(item.quantity) / numberOfPeople;
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            quantity: Math.round(splitQty * 1000) / 1000,
            discountAmount: Math.round((Number(item.discountAmount ?? 0) / numberOfPeople) * 100) / 100,
          },
        });
      }

      // Add note to original order
      await tx.order.update({
        where: { id: order.id },
        data: {
          note: `${order.note ? order.note + " | " : ""}Podział na ${numberOfPeople} osób`,
        },
      });

      return results;
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ORDER_SPLIT_BILL", "Order", orderId, undefined, {
      numberOfPeople,
      totalAmount: finalTotal,
      perPerson,
      splitOrderIds: splitOrders.map((s) => s.id),
    });

    return NextResponse.json({
      splits: splitOrders,
      totalAmount: finalTotal,
      perPerson,
      numberOfPeople,
    });
  } catch (e) {
    console.error("[Split Bill]", e);
    return NextResponse.json({ error: "Błąd podziału rachunku" }, { status: 500 });
  }
}
