export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processExpiredLocks } from "@/lib/payment/expire-locks";

/**
 * CRON endpoint — wywoływany co 5 minut.
 * Zwolnienie locków wygasłych płatności QR (timeout 15 min).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await processExpiredLocks(prisma);
    return NextResponse.json({
      ok: true,
      message: "Expired QR locks processed",
      count,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[CRON expire-qr-locks]", e);
    return NextResponse.json(
      { error: "Failed to process expired locks" },
      { status: 500 }
    );
  }
}
