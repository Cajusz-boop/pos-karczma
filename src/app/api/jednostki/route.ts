export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/jednostki — przeliczniki jednostek dla kalkulatora */
export async function GET() {
  try {
    const rows = await prisma.unitConversion.findMany({ orderBy: [{ fromUnit: "asc" }, { toUnit: "asc" }] });
    return NextResponse.json(rows.map((r) => ({ fromUnit: r.fromUnit, toUnit: r.toUnit, factor: r.factor })));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 500 });
  }
}
