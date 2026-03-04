export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/receptury/categories — unikalne statusy receptur (kompatybilność) */
export async function GET() {
  try {
    return NextResponse.json(["AKTYWNA", "ARCHIWALNA"]);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 500 });
  }
}
