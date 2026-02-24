export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { 
  createPaymentIntent, 
  confirmPayment, 
  cancelPayment,
  getTerminalStatus 
} from "@/lib/payment-terminal/client";

/**
 * POST /api/payment/terminal
 * Create, confirm, or cancel a payment intent.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, amount, orderId, intentId, description } = body;

    switch (action) {
      case "create": {
        if (!amount || !orderId) {
          return NextResponse.json(
            { error: "Missing amount or orderId" },
            { status: 400 }
          );
        }
        const intent = await createPaymentIntent(amount, orderId, description);
        return NextResponse.json(intent);
      }

      case "confirm": {
        if (!intentId) {
          return NextResponse.json(
            { error: "Missing intentId" },
            { status: 400 }
          );
        }
        const result = await confirmPayment(intentId);
        return NextResponse.json(result);
      }

      case "cancel": {
        if (!intentId) {
          return NextResponse.json(
            { error: "Missing intentId" },
            { status: 400 }
          );
        }
        const result = await cancelPayment(intentId);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: create, confirm, cancel" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Payment Terminal API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/terminal
 * Get terminal status.
 */
export async function GET() {
  try {
    const status = await getTerminalStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("[Payment Terminal API] Status error:", error);
    return NextResponse.json(
      { error: "Failed to get terminal status" },
      { status: 500 }
    );
  }
}
