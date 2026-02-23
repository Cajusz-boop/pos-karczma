import { NextRequest, NextResponse } from "next/server";
import { confirmPayment } from "@/lib/payment-terminal/client";

export const dynamic = 'force-dynamic';


/**
 * GET /api/payment/polcard-status?intentId=xxx
 * Check the status of a pending PolCard Go payment.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const intentId = searchParams.get("intentId");

    if (!intentId) {
      return NextResponse.json(
        { error: "Missing intentId" },
        { status: 400 }
      );
    }

    const result = await confirmPayment(intentId);

    return NextResponse.json({
      intentId,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      transactionRef: result.transactionRef,
      errorMessage: result.errorMessage,
      polcardResponse: result.polcardResponse,
    });
  } catch (error) {
    console.error("[PolCard Status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
