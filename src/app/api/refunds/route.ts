export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { z } from "zod";
import { parseBody } from "@/lib/validation";


const refundSchema = z.object({
  orderId: z.string().min(1, "Wymagany ID zamĂłwienia"),
  items: z.array(z.object({
    orderItemId: z.string().min(1),
    quantity: z.number().positive("IloĹ›Ä‡ musi byÄ‡ > 0"),
    reason: z.string().min(1, "Wymagany powĂłd zwrotu").max(200),
  })).min(1, "Wymagana co najmniej 1 pozycja"),
  refundMethod: z.enum(["CASH", "CARD", "BLIK", "TRANSFER", "VOUCHER"]),
});

/**
 * GET /api/refunds â€” list recent refunds (cancelled items with reasons)
 */
export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "50");
    const dateFrom = request.nextUrl.searchParams.get("dateFrom");

    const where: Record<string, unknown> = {
      status: "CANCELLED",
      cancelReason: { not: null },
    };
    if (dateFrom) {
      where.cancelledAt = { gte: new Date(dateFrom) };
    }

    const cancelledItems = await prisma.orderItem.findMany({
      where,
      include: {
        order: { select: { id: true, orderNumber: true, userId: true } },
        product: { select: { id: true, name: true } },
        taxRate: { select: { fiscalSymbol: true, ratePercent: true } },
      },
      orderBy: { cancelledAt: "desc" },
      take: limit,
    });

    return NextResponse.json(
      cancelledItems.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        orderNumber: item.order.orderNumber,
        productName: item.product.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalRefund: Number(item.quantity) * Number(item.unitPrice),
        reason: item.cancelReason,
        cancelledAt: item.cancelledAt?.toISOString() ?? null,
        taxSymbol: item.taxRate.fiscalSymbol,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d pobierania zwrotĂłw" }, { status: 500 });
  }
}

/**
 * POST /api/refunds â€” process a refund (cancel items, record refund payment)
 */
export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, refundSchema);
    if (valError) return valError;

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ZamĂłwienie nie istnieje" }, { status: 404 });
    }

    if (order.status !== "CLOSED") {
      return NextResponse.json(
        { error: "Zwrot moĹĽliwy tylko dla zamkniÄ™tych zamĂłwieĹ„" },
        { status: 400 }
      );
    }

    const now = new Date();
    let totalRefund = 0;
    const refundedItems: Array<{ itemId: string; productName: string; quantity: number; amount: number }> = [];

    for (const refundItem of data.items) {
      const orderItem = order.items.find((i) => i.id === refundItem.orderItemId);
      if (!orderItem) {
        return NextResponse.json(
          { error: `Pozycja ${refundItem.orderItemId} nie istnieje w zamĂłwieniu` },
          { status: 404 }
        );
      }

      if (orderItem.status === "CANCELLED") {
        return NextResponse.json(
          { error: `Pozycja ${refundItem.orderItemId} jest juĹĽ anulowana` },
          { status: 400 }
        );
      }

      if (refundItem.quantity > Number(orderItem.quantity)) {
        return NextResponse.json(
          { error: `IloĹ›Ä‡ zwrotu (${refundItem.quantity}) przekracza iloĹ›Ä‡ zamĂłwionÄ… (${orderItem.quantity})` },
          { status: 400 }
        );
      }

      const refundAmount = refundItem.quantity * Number(orderItem.unitPrice);
      totalRefund += refundAmount;

      // Cancel the item
      await prisma.orderItem.update({
        where: { id: refundItem.orderItemId },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
          cancelReason: refundItem.reason,
        },
      });

      refundedItems.push({
        itemId: refundItem.orderItemId,
        productName: orderItem.productId, // Will be resolved below
        quantity: refundItem.quantity,
        amount: refundAmount,
      });
    }

    // Record negative payment (refund)
    await prisma.payment.create({
      data: {
        orderId: data.orderId,
        method: data.refundMethod,
        amount: -totalRefund,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "REFUND", "Order", data.orderId, undefined, {
      totalRefund: Math.round(totalRefund * 100) / 100,
      refundMethod: data.refundMethod,
      itemCount: data.items.length,
      reasons: data.items.map((i) => i.reason),
    });

    return NextResponse.json({
      ok: true,
      orderId: data.orderId,
      totalRefund: Math.round(totalRefund * 100) / 100,
      refundMethod: data.refundMethod,
      refundedItems: refundedItems.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d przetwarzania zwrotu" }, { status: 500 });
  }
}
