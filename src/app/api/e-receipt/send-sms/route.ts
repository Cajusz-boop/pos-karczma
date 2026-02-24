export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms/client";
import { parseBody, sendSmsSchema } from "@/lib/validation";

/**
 * POST /api/e-receipt/send-sms
 * Body: { receiptId: string, phone: string }
 * Finds receipt, sends SMS with e-receipt link, updates receipt.
 */
export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, sendSmsSchema);
    if (valError) return valError;
    const { receiptId, phone } = data;

    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        order: { select: { orderNumber: true } },
      },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Paragon nie znaleziony" }, { status: 404 });
    }

    if (!receipt.htmlContent) {
      return NextResponse.json(
        { error: "Paragon nie ma wygenerowanej treści HTML" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    const link = `${baseUrl}/e-receipt/${receipt.token}`;

    const message = `Karczma Łabędź - Twój e-paragon nr ${receipt.order.orderNumber}: ${link}`;

    const sent = await sendSms(phone, message);

    if (!sent) {
      return NextResponse.json(
        { error: "Nie udało się wysłać wiadomości SMS" },
        { status: 500 }
      );
    }

    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        customerPhone: phone,
        deliveryMethod: "SMS",
      },
    });

    return NextResponse.json({ ok: true, message: "SMS wysłany" });
  } catch (e) {
    console.error("[e-receipt] send-sms error:", e);
    return NextResponse.json(
      { error: "Błąd serwera podczas wysyłania SMS" },
      { status: 500 }
    );
  }
}
