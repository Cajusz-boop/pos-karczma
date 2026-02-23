import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processNoShows } from "@/lib/reservations/no-show";

export const dynamic = process.env.CAPACITOR_BUILD === "1" ? "force-static" : "force-dynamic";
export const revalidate = process.env.CAPACITOR_BUILD === "1" ? 999999 : 0;

/**
 * CRON endpoint - wywoływany co 5 minut przez external cron (Vercel Cron, systemd timer, etc.)
 * Przetwarza rezerwacje NO_SHOW bez blokowania głównych endpointów.
 * 
 * Konfiguracja Vercel Cron (vercel.json):
 * { "crons": [{ "path": "/api/cron/no-shows", "schedule": "*​/5 * * * *" }] }
 */
export async function GET(request: NextRequest) {
  const start = performance.now();
  
  try {
    // Opcjonalna autoryzacja przez secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await processNoShows(prisma);
    
    const elapsed = Math.round(performance.now() - start);
    
    return NextResponse.json({
      ok: true,
      message: "No-shows processed",
      durationMs: elapsed,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[CRON no-shows]", e);
    return NextResponse.json(
      { error: "Failed to process no-shows" },
      { status: 500 }
    );
  }
}
