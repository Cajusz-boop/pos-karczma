import { NextRequest, NextResponse } from "next/server";
import { processPolcardGoCallback } from "@/lib/payment-terminal/client";
import type { PolcardGoResponse } from "@/lib/payment-terminal/types";

export const dynamic = 'force-dynamic';


/**
 * POST /api/payment/polcard-callback
 * Callback endpoint for PolCard Go app to report transaction results.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const intentId = body.intentId || body.orderId || body.merchantReference;
    
    if (!intentId) {
      return NextResponse.json(
        { error: "Missing intentId or orderId" },
        { status: 400 }
      );
    }

    const response: PolcardGoResponse = {
      success: body.success ?? body.status === "APPROVED",
      transactionId: body.transactionId ?? body.operationId,
      authorizationCode: body.authorizationCode ?? body.authCode,
      cardMasked: body.cardMasked ?? body.maskedPan,
      cardType: mapCardType(body.cardType ?? body.cardBrand),
      amount: parseAmount(body.amount),
      currency: body.currency ?? "PLN",
      timestamp: body.timestamp ?? new Date().toISOString(),
      errorCode: body.errorCode,
      errorMessage: body.errorMessage ?? body.declineReason,
      receiptData: body.receiptData ?? {
        merchantName: body.merchantName,
        terminalId: body.terminalId,
        transactionDate: body.transactionDate,
        transactionTime: body.transactionTime,
        authCode: body.authorizationCode,
        rrn: body.rrn,
      },
    };

    const result = await processPolcardGoCallback(intentId, response);

    return NextResponse.json({
      success: result.status === "SUCCEEDED",
      intentId,
      status: result.status,
      transactionRef: result.transactionRef,
    });
  } catch (error) {
    console.error("[PolCard Callback] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/polcard-callback
 * Alternative callback via GET with query params (for deep link returns).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const intentId = searchParams.get("intentId") || searchParams.get("orderId");
    const success = searchParams.get("success") === "true" || searchParams.get("status") === "APPROVED";
    
    if (!intentId) {
      return NextResponse.redirect(new URL("/pos?payment=error&reason=missing_id", request.url));
    }

    const response: PolcardGoResponse = {
      success,
      transactionId: searchParams.get("transactionId") ?? undefined,
      authorizationCode: searchParams.get("authCode") ?? undefined,
      cardMasked: searchParams.get("cardMasked") ?? undefined,
      amount: parseAmount(searchParams.get("amount")),
      currency: searchParams.get("currency") ?? "PLN",
      timestamp: new Date().toISOString(),
      errorCode: searchParams.get("errorCode") ?? undefined,
      errorMessage: searchParams.get("errorMessage") ?? undefined,
    };

    await processPolcardGoCallback(intentId, response);

    const redirectUrl = new URL("/pos", request.url);
    redirectUrl.searchParams.set("payment", success ? "success" : "failed");
    redirectUrl.searchParams.set("intentId", intentId);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[PolCard Callback GET] Error:", error);
    return NextResponse.redirect(new URL("/pos?payment=error", request.url));
  }
}

function mapCardType(type: string | undefined): "VISA" | "MASTERCARD" | "OTHER" {
  if (!type) return "OTHER";
  const upper = type.toUpperCase();
  if (upper.includes("VISA")) return "VISA";
  if (upper.includes("MASTER")) return "MASTERCARD";
  return "OTHER";
}

function parseAmount(amount: string | number | null | undefined): number | undefined {
  if (amount === null || amount === undefined) return undefined;
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return undefined;
  return num > 100 ? num / 100 : num;
}
