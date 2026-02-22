import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const redeemSchema = z.object({
  code: z.string().min(1, "Wymagany kod vouchera"),
  amount: z.number().positive("Kwota musi być > 0"),
  orderId: z.string().min(1, "Wymagany orderId"),
});

/**
 * POST /api/vouchers/redeem — use voucher as payment
 * Validates balance, deducts amount, creates Payment record, returns remaining balance.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { code, amount, orderId } = parsed.data;

    const voucher = await prisma.giftVoucher.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!voucher) {
      return NextResponse.json({ error: "Voucher nie znaleziony" }, { status: 404 });
    }

    if (!voucher.isActive) {
      return NextResponse.json({ error: "Voucher jest dezaktywowany" }, { status: 400 });
    }

    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      return NextResponse.json({ error: "Voucher wygasł" }, { status: 400 });
    }

    const balance = Number(voucher.balance);
    if (balance <= 0) {
      return NextResponse.json({ error: "Voucher ma zerowe saldo" }, { status: 400 });
    }

    const redeemAmount = Math.min(amount, balance);
    const newBalance = Math.round((balance - redeemAmount) * 100) / 100;

    // Verify order exists
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }
    if (order.status === "CLOSED" || order.status === "CANCELLED") {
      return NextResponse.json({ error: "Zamówienie jest zamknięte/anulowane" }, { status: 400 });
    }

    // Transaction: deduct balance + create payment
    const result = await prisma.$transaction(async (tx) => {
      await tx.giftVoucher.update({
        where: { id: voucher.id },
        data: {
          balance: newBalance,
          isActive: newBalance > 0,
        },
      });

      const payment = await tx.payment.create({
        data: {
          orderId,
          method: "VOUCHER",
          amount: redeemAmount,
          tipAmount: 0,
          voucherId: voucher.id,
          transactionRef: voucher.code,
        },
      });

      return { payment, redeemAmount, newBalance };
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "VOUCHER_REDEEMED", "GiftVoucher", voucher.id, undefined, {
      code: voucher.code,
      redeemAmount: result.redeemAmount,
      newBalance: result.newBalance,
      orderId,
    });

    return NextResponse.json({
      redeemed: result.redeemAmount,
      remainingBalance: result.newBalance,
      paymentId: result.payment.id,
      voucherCode: voucher.code,
    });
  } catch (e) {
    console.error("[Voucher Redeem]", e);
    return NextResponse.json({ error: "Błąd realizacji vouchera" }, { status: 500 });
  }
}
