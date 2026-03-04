export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/pakiety?eventType= — lista pakietów menu (opcjonalnie filtrowana po typie imprezy) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType");

    const where: { isActive?: boolean; eventType?: string } = { isActive: true };
    const validTypes = [
      "WESELE",
      "CHRZCINY",
      "KOMUNIA",
      "URODZINY",
      "KONFERENCJA",
      "INNE",
    ];
    const mapped =
      eventType === "POPRAWINY"
        ? "WESELE"
        : eventType === "URODZINY_ROCZNICA"
          ? "URODZINY"
          : eventType;
    if (mapped && validTypes.includes(mapped)) {
      where.eventType = mapped;
    }

    const packages = await prisma.eventPackage.findMany({
      where,
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      packages.map((p) => ({
        id: p.id,
        name: p.name,
        eventType: p.eventType,
        itemCount: p._count.items,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania pakietów" }, { status: 500 });
  }
}
