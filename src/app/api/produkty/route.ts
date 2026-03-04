export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/jwt";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 }) };
  if (user.roleName !== "ADMIN" && !user.isOwner) {
    return { error: NextResponse.json({ error: "Dostęp tylko dla administratora" }, { status: 403 }) };
  }
  return { user };
}

/** GET /api/produkty?search=X — autocomplete, max 20 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const where = search
      ? { name: { contains: search }, mergedIntoId: null }
      : { mergedIntoId: null };

    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 2000);

    if (search) {
      const products = await prisma.recipeProduct.findMany({
        where,
        orderBy: { name: "asc" },
        take: limit,
      });
      return NextResponse.json(products.map((p) => ({ id: p.id, name: p.name, defaultUnit: p.defaultUnit })));
    }

    const products = await prisma.recipeProduct.findMany({
      where,
      orderBy: { name: "asc" },
      take: limit,
      include: { _count: { select: { ingredients: true } }, mergedInto: { select: { name: true } } },
    });
    return NextResponse.json(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        defaultUnit: p.defaultUnit,
        mergedIntoId: p.mergedIntoId,
        mergedIntoName: p.mergedInto?.name ?? null,
        ingredientCount: p._count.ingredients,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania produktów" }, { status: 500 });
  }
}

/** POST /api/produkty — utwórz produkt */
export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const body = await request.json();
    const { name, defaultUnit = "kg" } = body as { name: string; defaultUnit?: string };
    if (!name?.trim()) return NextResponse.json({ error: "Nazwa jest wymagana" }, { status: 400 });

    const product = await prisma.recipeProduct.create({
      data: { name: name.trim(), defaultUnit: String(defaultUnit || "kg").slice(0, 20) },
    });
    return NextResponse.json({ id: product.id, name: product.name, defaultUnit: product.defaultUnit });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia produktu" }, { status: 500 });
  }
}
