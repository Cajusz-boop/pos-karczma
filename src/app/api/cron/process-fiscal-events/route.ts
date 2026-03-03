export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processOnlinePaymentFiscalEvent } from "@/lib/fiscal/process-online-payment";

/**
 * CRON — co 1 min. Przetwarza PENDING FiscalEvent z source ONLINE_PAYMENT.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pending = await prisma.fiscalEvent.findMany({
      where: { type: "RECEIPT_PRINTED", status: "PENDING" },
      take: 20,
    });

    const onlinePaymentEvents = pending.filter(
      (e) => (e.payloadJson as { source?: string } | null)?.source === "ONLINE_PAYMENT"
    );

    let processed = 0;
    const errors: string[] = [];

    for (const ev of onlinePaymentEvents) {
      const result = await processOnlinePaymentFiscalEvent(ev.id);
      if (result.success) {
        processed++;
      } else {
        errors.push(`${ev.id}: ${result.error}`);
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      total: onlinePaymentEvents.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[CRON process-fiscal-events]", e);
    return NextResponse.json(
      { error: "Failed to process fiscal events" },
      { status: 500 }
    );
  }
}
