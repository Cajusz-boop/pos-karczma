import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** PUT /api/procurement/packages/[id] — edytuj pakiet */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, eventType, pricePerPerson, notes, isActive, items } = body;

    const updateData: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) updateData.name = name.trim();
    if (eventType != null) updateData.eventType = eventType;
    if (pricePerPerson !== undefined)
      updateData.pricePerPerson =
        typeof pricePerPerson === "number" ? pricePerPerson : null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    if (Array.isArray(items)) {
      await prisma.eventPackageItem.deleteMany({ where: { packageId: numId } });
      if (items.length > 0) {
        await prisma.eventPackageItem.createMany({
          data: items.map(
            (it: {
              recipeDishId: number;
              portionsPerPerson?: number;
              sortOrder?: number;
            }) => ({
              packageId: numId,
              recipeDishId: it.recipeDishId,
              portionsPerPerson: it.portionsPerPerson ?? 1,
              sortOrder: it.sortOrder ?? 0,
            })
          ),
        });
      }
    }

    const pkg = await prisma.eventPackage.update({
      where: { id: numId },
      data: updateData,
      include: {
        items: {
          include: {
            recipeDish: { select: { id: true, name: true, recipeNumber: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(pkg);
  } catch (e) {
    console.error("[procurement/packages PUT]", e);
    return NextResponse.json(
      { error: "Błąd aktualizacji pakietu" },
      { status: 500 }
    );
  }
}
