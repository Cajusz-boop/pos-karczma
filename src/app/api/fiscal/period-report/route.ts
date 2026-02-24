import { NextRequest, NextResponse } from "next/server";
import { posnetDriver } from "@/lib/fiscal";

/** POST /api/fiscal/period-report — raport okresowy (wydruk na drukarce fiskalnej) */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { dateFrom, dateTo } = body as { dateFrom?: string; dateTo?: string };
    const from = dateFrom ?? new Date().toISOString().slice(0, 10);
    const to = dateTo ?? from;
    const result = await posnetDriver.printPeriodReport(from, to);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Błąd raportu okresowego" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, dateFrom: from, dateTo: to });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd raportu okresowego" }, { status: 500 });
  }
}
