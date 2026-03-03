export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";
import { getStripe, getStripeWebhookSecret } from "@/lib/payment/stripe";
import { auditLog } from "@/lib/audit";
import { emitTableEvent } from "@/lib/sse/event-bus";

function buildFiscalPayload(
  payment: { amount: unknown; tipAmount: unknown; id: string },
  items: Array<{ name: string; quantity: number; unitPrice: number; fiscalSymbol: string }>
) {
  return {
    source: "ONLINE_PAYMENT",
    onlinePaymentId: payment.id,
    items: items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      fiscalSymbol: i.fiscalSymbol,
    })),
    amount: Number(payment.amount),
    tipAmount: Number(payment.tipAmount),
  };
}

function detectPaymentMethod(intent: Stripe.PaymentIntent): "CARD" | "BLIK" {
  const pm = intent.payment_method;
  if (typeof pm === "string") return "CARD";
  const obj = pm as { type?: string } | null;
  if (obj?.type === "blik") return "BLIK";
  return "CARD";
}

async function renderReceiptHtml(
  payment: { itemsJson: unknown; amount: unknown; tipAmount: unknown; orderNumber?: number }
): Promise<string> {
  const items = (payment.itemsJson as Array<{ name: string; quantity: number; unitPrice: number; lineTotal: number }>) ?? [];
  const amount = Number(payment.amount);
  const tip = Number(payment.tipAmount);
  const total = amount + tip;

  const rows = items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.name)}</td><td>${i.quantity}</td><td>${i.unitPrice.toFixed(2)} PLN</td><td>${i.lineTotal?.toFixed(2) ?? (i.quantity * i.unitPrice).toFixed(2)} PLN</td></tr>`
    )
    .join("");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Potwierdzenie płatności</title></head>
<body style="font-family:sans-serif;padding:1rem;">
<h1>Potwierdzenie płatności — Karczma Łabędź</h1>
<p>Zamówienie nr ${payment.orderNumber ?? ""}</p>
<table border="1" cellpadding="8" style="border-collapse:collapse;">
<thead><tr><th>Pozycja</th><th>Ilość</th><th>Cena j.</th><th>Wartość</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<p><strong>Kwota pozycji:</strong> ${amount.toFixed(2)} PLN</p>
${tip > 0 ? `<p><strong>Napiwek:</strong> ${tip.toFixed(2)} PLN</p>` : ""}
<p><strong>Razem:</strong> ${total.toFixed(2)} PLN</p>
<p style="color:#0a0;">Płatność zakończona pomyślnie.</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * POST /api/webhooks/stripe
 * Webhook Stripe — natychmiast zwracamy 200, przetwarzanie w transakcji.
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = getStripeWebhookSecret();

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook nie skonfigurowany" },
      { status: 503 }
    );
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Brak podpisu" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook/stripe] Signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const paymentId = intent.metadata?.paymentId;
    if (!paymentId) {
      return new Response("OK", { status: 200 });
    }

    try {
      const payment = await prisma.onlinePayment.findUnique({
        where: { id: paymentId },
        include: {
          order: {
            include: {
              table: { select: { qrId: true } },
              items: true,
            },
          },
        },
      });

      if (!payment || payment.status !== "PENDING") {
        return new Response("OK", { status: 200 });
      }

      const itemsData = (payment.itemsJson as Array<{
        orderItemId: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        fiscalSymbol: string;
        name: string;
      }>) ?? [];

      await prisma.$transaction(async (tx) => {
        await tx.onlinePayment.update({
          where: { id: paymentId },
          data: {
            status: "SUCCESS",
            completedAt: new Date(),
            providerResponse: intent as unknown as object,
          },
        });

        for (const item of itemsData) {
          await tx.orderItem.update({
            where: { id: item.orderItemId },
            data: {
              lockedQuantity: { decrement: item.quantity },
              paidQuantity: { increment: item.quantity },
            },
          });
        }

        await tx.payment.create({
          data: {
            orderId: payment.orderId,
            method: detectPaymentMethod(intent),
            amount: payment.amount,
            tipAmount: payment.tipAmount,
            transactionRef: intent.id,
          },
        });

        if (Number(payment.tipAmount) > 0 && payment.order.userId) {
          await tx.tip.create({
            data: {
              orderId: payment.orderId,
              userId: payment.order.userId,
              amount: payment.tipAmount,
              method: detectPaymentMethod(intent),
            },
          });
        }

        const allItems = await tx.orderItem.findMany({
          where: { orderId: payment.orderId, status: { not: "CANCELLED" } },
        });
        const fullyPaid = allItems.every(
          (i) => Number(i.paidQuantity) >= Number(i.quantity)
        );
        await tx.order.update({
          where: { id: payment.orderId },
          data: { onlinePaymentStatus: fullyPaid ? "PAID" : "PARTIAL" },
        });

        const fiscalPrinter = await tx.printer.findFirst({
          where: { type: "FISCAL", isActive: true },
          select: { id: true },
        });

        await tx.fiscalEvent.create({
          data: {
            orderId: payment.orderId,
            paymentId: paymentId,
            type: "RECEIPT_PRINTED",
            status: "PENDING",
            payloadJson: buildFiscalPayload(payment, itemsData) as object,
          },
        });

        const htmlContent = await renderReceiptHtml(payment);
        await tx.receipt.create({
          data: {
            orderId: payment.orderId,
            fiscalNumber: "PENDING",
            printerId: fiscalPrinter?.id ?? "SYSTEM",
            token: payment.receiptToken ?? crypto.randomUUID(),
            customerEmail: payment.customerEmail ?? undefined,
            deliveryMethod: "QR",
            htmlContent,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        if (intent.metadata?.wantInvoice === "true" && intent.metadata?.invoiceNip) {
          const { createKsefInvoiceFromPayment } = await import("@/lib/payment/create-ksef-invoice");
          await createKsefInvoiceFromPayment(tx as never, payment.orderId, intent.metadata.invoiceNip, itemsData, Number(payment.amount));
        }

        await auditLog(
          null,
          "ONLINE_PAYMENT_SUCCESS",
          "OnlinePayment",
          paymentId,
          undefined,
          { transactionId: intent.id, amount: Number(payment.totalCharged) }
        );
      });

      const qrId = payment.order.table?.qrId;
      if (qrId) {
        emitTableEvent(qrId, {
          type: "PAYMENT_CONFIRMED",
          payload: { paymentId },
        });
      }
      } catch (e) {
        console.error("[webhook/stripe] payment_intent.succeeded error:", e);
        Sentry.captureException(e, {
          tags: { paymentId: intent.metadata?.paymentId },
          extra: { event: "payment_intent.succeeded" },
        });
      }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const paymentId = intent.metadata?.paymentId;
    if (paymentId) {
      try {
        const payment = await prisma.onlinePayment.findUnique({
          where: { id: paymentId },
          include: { order: { include: { table: { select: { qrId: true } } } } },
        });
        if (payment && payment.status === "PENDING") {
          const items = (payment.itemsJson as Array<{ orderItemId: string; quantity: number }>) ?? [];
          const errMsg = (intent as { last_payment_error?: { message?: string } })?.last_payment_error?.message ?? "Payment failed";
          await prisma.$transaction(async (tx) => {
            for (const item of items) {
              await tx.orderItem.update({
                where: { id: item.orderItemId },
                data: { lockedQuantity: { decrement: item.quantity } },
              });
            }
            await tx.onlinePayment.update({
              where: { id: paymentId },
              data: { status: "FAILED", errorMessage: errMsg },
            });
            await auditLog(null, "ONLINE_PAYMENT_FAILED", "OnlinePayment", paymentId, undefined, { reason: "stripe_failed" });
          });
          Sentry.captureMessage("ONLINE_PAYMENT_FAILED", {
            level: "error",
            tags: { paymentId, orderId: payment.orderId },
            extra: { errorMessage: errMsg },
          });
          const qrId = payment.order.table?.qrId;
          if (qrId) {
            emitTableEvent(qrId, { type: "PAYMENT_FAILED", payload: { paymentId } });
          }
        }
      } catch (e) {
        console.error("[webhook/stripe] payment_failed release locks error:", e);
      }
    }
  }

  return new Response("OK", { status: 200 });
}
