import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createPaymentSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, createPaymentSchema);
    if (valError) return valError;
    const { orderId, payments, tipAmount, tipUserId } = data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        payments: true,
        items: {
          where: { status: { not: "CANCELLED" } },
          select: { quantity: true, unitPrice: true, discountAmount: true },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }
    if (order.status === "CLOSED") {
      return NextResponse.json({ error: "Zamówienie jest już zamknięte" }, { status: 400 });
    }
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Zamówienie jest anulowane" }, { status: 400 });
    }

    const existingPaid = order.payments.reduce(
      (sum, p) => sum + Number(p.amount), 0
    );
    if (existingPaid > 0) {
      return NextResponse.json(
        { error: "Zamówienie ma już zarejestrowane płatności. Usuń je przed dodaniem nowych." },
        { status: 400 }
      );
    }

    const orderTotal = order.items.reduce(
      (sum, i) =>
        sum + Number(i.quantity) * Number(i.unitPrice) - Number(i.discountAmount ?? 0),
      0
    );

    let discountAmount = 0;
    if (order.discountJson && typeof order.discountJson === "object") {
      const d = order.discountJson as { type?: string; value?: number };
      if (d.type === "PERCENT" && typeof d.value === "number") {
        discountAmount = (orderTotal * d.value) / 100;
      } else if (d.type === "AMOUNT" && typeof d.value === "number") {
        discountAmount = d.value;
      }
    }
    const finalTotal = Math.round((orderTotal - discountAmount) * 100) / 100;

    const paymentSum = Math.round(
      payments.reduce((sum, p) => sum + p.amount, 0) * 100
    ) / 100;

    if (paymentSum < finalTotal) {
      return NextResponse.json(
        {
          error: `Suma płatności (${paymentSum.toFixed(2)} zł) jest mniejsza niż kwota zamówienia (${finalTotal.toFixed(2)} zł)`,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const p of payments) {
        await tx.payment.create({
          data: {
            orderId,
            method: p.method as "CASH" | "CARD" | "BLIK" | "TRANSFER" | "VOUCHER" | "ROOM_CHARGE",
            amount: p.amount,
            tipAmount: 0,
            transactionRef: p.transactionRef ?? null,
          },
        });
      }
      if (tipAmount != null && tipAmount > 0 && tipUserId) {
        const firstPayment = payments[0];
        await tx.tip.create({
          data: {
            orderId,
            userId: tipUserId,
            amount: tipAmount,
            method: (firstPayment?.method as "CASH" | "CARD" | "BLIK" | "TRANSFER" | "VOUCHER" | "ROOM_CHARGE") ?? "CASH",
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zapisu płatności" }, { status: 500 });
  }
}
