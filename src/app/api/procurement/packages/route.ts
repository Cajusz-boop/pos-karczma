import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/procurement/packages — lista pakietów menu (?all=1 zwraca też nieaktywne) */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "1";

    const packages = await prisma.eventPackage.findMany({
      where: all ? {} : { isActive: true },
      include: {
        items: {
          include: {
            recipeDish: { select: { id: true, name: true, recipeNumber: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(packages);
  } catch (e) {
    console.error("[procurement/packages GET]", e);
    return NextResponse.json(
      { error: "Błąd pobierania pakietów" },
      { status: 500 }
    );
  }
}

/** POST /api/procurement/packages — stwórz pakiet */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, eventType, pricePerPerson, notes, items } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nazwa pakietu jest wymagana" },
        { status: 400 }
      );
    }

    const pkg = await prisma.eventPackage.create({
      data: {
        name: name.trim(),
        eventType: eventType ?? "INNE",
        pricePerPerson:
          typeof pricePerPerson === "number" ? pricePerPerson : null,
        notes: notes?.trim() || null,
        items:
          Array.isArray(items) && items.length > 0
            ? {
                create: items.map(
                  (it: {
                    recipeDishId: number;
                    portionsPerPerson?: number;
                    sortOrder?: number;
                  }) => ({
                    recipeDishId: it.recipeDishId,
                    portionsPerPerson: it.portionsPerPerson ?? 1,
                    sortOrder: it.sortOrder ?? 0,
                  })
                ),
              }
            : undefined,
      },
      include: {
        items: {
          include: {
            recipeDish: { select: { id: true, name: true, recipeNumber: true } },
          },
        },
      },
    });

    return NextResponse.json(pkg);
  } catch (e) {
    console.error("[procurement/packages POST]", e);
    return NextResponse.json(
      { error: "Błąd tworzenia pakietu" },
      { status: 500 }
    );
  }
}
