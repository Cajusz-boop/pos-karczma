import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/** GET /api/kds/station-list - list KDS stations (alias for /api/kds/stations, avoids export path conflict) */
export async function GET() {
  try {
    const stations = await prisma.kDSStation.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        categories: { include: { category: { select: { id: true, name: true } } } },
      },
    });
    return NextResponse.json(
      stations.map((s) => ({
        id: s.id,
        name: s.name,
        displayOrder: s.displayOrder,
        categoryIds: s.categories.map((c) => c.categoryId),
        categoryNames: s.categories.map((c) => c.category.name),
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania stacji KDS" }, { status: 500 });
  }
}
