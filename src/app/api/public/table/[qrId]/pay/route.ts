export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/payment/stripe";
import { auditLog } from "@/lib/audit";
import Decimal from "decimal.js";
import { z } from "zod";

const payRequestSchema = z.object({
  items: z.array(
    z.object({
      orderItemId: z.string(),
      quantity: z.number().positive(),
    })
  ),
  tipPercent: z.number().min(0).max(100).optional(),
  tipAmount: z.number().min(0).optional(),
  provider: z.literal("STRIPE"),
  customerEmail: z.string().email().optional().nullable(),
  wantInvoice: z.boolean().optional(),
  invoiceNip: z.string().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ qrId: string }> }
) {
  try {
    const { qrId } = await params;
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe nie jest skonfigurowany" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parseResult = payRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const req = parseResult.data;

    const table = await prisma.table.findUnique({
      where: { qrId },
      select: { id: true },
    });
    if (!table) {
      return NextResponse.json({ error: "TABLE_NOT_FOUND" }, { status: 404 });
    }

    const order = await prisma.order.findFirst({
      where: {
        tableId: table.id,
        status: { notIn: ["CLOSED", "CANCELLED"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          where: { status: { not: "CANCELLED" } },
          include: {
            product: { select: { name: true } },
            taxRate: { select: { fiscalSymbol: true, ratePercent: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Brak aktywnego zamówienia" },
        { status: 404 }
      );
    }

    const baseUrl =
      process.env.RECEIPT_BASE_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const result = await prisma.$transaction(async (tx) => {
      const orderItemsMap = new Map(
        order.items.map((i) => [i.id, i])
      );

      const unavailableItems: {
        orderItemId: string;
        requested: number;
        available: number;
      }[] = [];

      for (const item of req.items) {
        const oi = orderItemsMap.get(item.orderItemId);
        if (!oi) {
          unavailableItems.push({
            orderItemId: item.orderItemId,
            requested: item.quantity,
            available: 0,
          });
          continue;
        }
        const qty = Number(oi.quantity);
        const paid = Number(oi.paidQuantity ?? 0);
        const locked = Number(oi.lockedQuantity ?? 0);
        const available = new Decimal(qty).minus(paid).minus(locked).toNumber();
        if (available < item.quantity) {
          unavailableItems.push({
            orderItemId: item.orderItemId,
            requested: item.quantity,
            available,
          });
        }
      }

      if (unavailableItems.length > 0) {
        throw { conflict: true, unavailableItems };
      }

      let amount = new Decimal(0);
      const serializedItems: Array<{
        orderItemId: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        fiscalSymbol: string;
        name: string;
      }> = [];

      for (const item of req.items) {
        const oi = orderItemsMap.get(item.orderItemId)!;
        const unitPrice = Number(oi.unitPrice);
        const lineTotal = new Decimal(item.quantity).times(unitPrice).toNumber();
        amount = amount.plus(lineTotal);
        serializedItems.push({
          orderItemId: item.orderItemId,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
          fiscalSymbol: oi.taxRate.fiscalSymbol,
          name: oi.product.name,
        });
      }

      let tipAmount = new Decimal(0);
      if (req.tipAmount != null && req.tipAmount > 0) {
        tipAmount = new Decimal(req.tipAmount);
      } else if (req.tipPercent != null && req.tipPercent > 0) {
        tipAmount = amount.times(req.tipPercent).div(100);
      }

      const totalCharged = amount.plus(tipAmount);
      const receiptToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      for (const item of req.items) {
        await tx.orderItem.update({
          where: { id: item.orderItemId },
          data: { lockedQuantity: { increment: item.quantity } },
        });
      }

      const payment = await tx.onlinePayment.create({
        data: {
          orderId: order.id,
          provider: "STRIPE",
          amount: amount.toDecimalPlaces(2),
          tipAmount: tipAmount.toDecimalPlaces(2),
          totalCharged: totalCharged.toDecimalPlaces(2),
          itemsJson: serializedItems as unknown as object,
          customerEmail: req.customerEmail ?? undefined,
          receiptToken,
          expiresAt,
        },
      });

      const intent = await stripe.paymentIntents.create({
        amount: Math.round(totalCharged.times(100).toNumber()),
        currency: "pln",
        payment_method_types: ["card", "blik", "p24"],
        metadata: {
          paymentId: payment.id,
          orderId: order.id,
          wantInvoice: String(!!req.wantInvoice),
          invoiceNip: req.invoiceNip ?? "",
        },
      });

      await tx.onlinePayment.update({
        where: { id: payment.id },
        data: { transactionId: intent.id },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { onlinePaymentStatus: "PENDING" },
      });

      await auditLog(
        null,
        "ONLINE_PAYMENT_CREATED",
        "OnlinePayment",
        payment.id,
        undefined,
        { amount: amount.toFixed(2), tip: tipAmount.toFixed(2) }
      );

      return {
        paymentId: payment.id,
        clientSecret: intent.client_secret!,
        totalAmount: amount.toNumber(),
        tipAmount: tipAmount.toNumber(),
        totalCharged: totalCharged.toNumber(),
        confirmationUrl: `${baseUrl.replace(/\/$/, "")}/confirm/${receiptToken}`,
      };
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "conflict" in e && (e as { conflict: boolean }).conflict) {
      const err = e as { conflict: boolean; unavailableItems: Array<{ orderItemId: string; requested: number; available: number }> };
      return NextResponse.json(
        { error: "ITEMS_UNAVAILABLE", unavailableItems: err.unavailableItems },
        { status: 409 }
      );
    }
    console.error("[pay] POST error:", e);
    return NextResponse.json(
      { error: "Błąd inicjalizacji płatności" },
      { status: 500 }
    );
  }
}
