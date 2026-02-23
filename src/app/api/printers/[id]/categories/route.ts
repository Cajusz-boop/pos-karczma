import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/printers/[id]/categories — przypisane kategorie */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const list = await prisma.printerCategory.findMany({
      where: { printerId: id },
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json(list.map((a) => ({ id: a.categoryId, name: a.category.name })));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania kategorii" }, { status: 500 });
  }
}

/** PUT /api/printers/[id]/categories — ustaw listę categoryIds (zastępuje obecne) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: printerId } = await params;
    const body = await request.json();
    const { categoryIds } = body as { categoryIds: string[] };

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json({ error: "categoryIds musi być tablicą" }, { status: 400 });
    }

    const ids = categoryIds.filter((id): id is string => Boolean(id));
    await prisma.printerCategory.deleteMany({ where: { printerId } });
    if (ids.length > 0) {
      await prisma.printerCategory.createMany({
        data: ids.map((categoryId) => ({ printerId, categoryId })),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zapisu kategorii" }, { status: 500 });
  }
}
