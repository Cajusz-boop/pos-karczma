import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, ingredientSchema } from "@/lib/validation";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { stockItems: true, recipeItems: true } },
      },
    });
    return NextResponse.json(
      ingredients.map((i) => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        category: i.category,
        defaultSupplier: i.defaultSupplier,
        stockItemsCount: i._count.stockItems,
        recipeItemsCount: i._count.recipeItems,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania składników" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, ingredientSchema);
    if (valError) return valError;
    const { name, unit, category, defaultSupplier } = data;
    const ingredient = await prisma.ingredient.create({
      data: {
        name: name.trim(),
        unit: unit.trim(),
        category: category?.trim() ?? null,
        defaultSupplier: defaultSupplier?.trim() ?? null,
      },
    });
    autoExportConfigSnapshot();
    return NextResponse.json(ingredient);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia składnika" }, { status: 500 });
  }
}
