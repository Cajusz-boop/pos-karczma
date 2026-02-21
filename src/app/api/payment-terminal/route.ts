import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createPaymentIntent,
  confirmPayment,
  cancelPayment,
  getTerminalStatus,
} from "@/lib/payment-terminal";
import { auditLog } from "@/lib/audit";

/**
 * GET /api/payment-terminal — terminal status
 */
export async function GET() {
  try {
    const status = await getTerminalStatus();
    return NextResponse.json(status);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd statusu terminala" }, { status: 500 });
  }
}

/**
 * POST /api/payment-terminal — create payment intent
 * Body: { action: "create"|"confirm"|"cancel", amount?, orderId?, intentId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, amount, orderId, intentId } = body as {
      action: "create" | "confirm" | "cancel";
      amount?: number;
      orderId?: string;
      intentId?: string;
    };

    const userId = request.headers.get("x-user-id");

    if (action === "create") {
      if (!amount || !orderId) {
        return NextResponse.json({ error: "Wymagane: amount, orderId" }, { status: 400 });
      }
      const intent = await createPaymentIntent(amount, orderId);
      await auditLog(userId, "TERMINAL_PAYMENT_CREATE", "Payment", intent.id, undefined, {
        amount,
        orderId,
        status: intent.status,
      });
      return NextResponse.json(intent);
    }

    if (action === "confirm") {
      if (!intentId) {
        return NextResponse.json({ error: "Wymagane: intentId" }, { status: 400 });
      }
      const result = await confirmPayment(intentId);
      await auditLog(userId, "TERMINAL_PAYMENT_CONFIRM", "Payment", intentId, undefined, {
        status: result.status,
        transactionRef: result.transactionRef,
      });
      return NextResponse.json(result);
    }

    if (action === "cancel") {
      if (!intentId) {
        return NextResponse.json({ error: "Wymagane: intentId" }, { status: 400 });
      }
      const result = await cancelPayment(intentId);
      await auditLog(userId, "TERMINAL_PAYMENT_CANCEL", "Payment", intentId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Nieznana akcja" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd operacji terminala" }, { status: 500 });
  }
}

/**
 * PUT /api/payment-terminal — update terminal config
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    await prisma.systemConfig.upsert({
      where: { key: "payment_terminal" },
      create: { key: "payment_terminal", value: body as object },
      update: { value: body as object },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "TERMINAL_CONFIG_UPDATE", "SystemConfig", "payment_terminal");

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zapisu konfiguracji" }, { status: 500 });
  }
}
