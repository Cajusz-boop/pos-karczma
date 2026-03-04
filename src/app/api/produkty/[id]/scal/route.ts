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

/** POST /api/produkty/[id]/scal — scal produkt źródłowy w docelowy (mergedInto) */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const { id } = await params;
    const sourceId = parseInt(id, 10);
    if (isNaN(sourceId)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

    const body = await request.json();
    const { targetProductId } = body as { targetProductId?: number };
    if (targetProductId == null || typeof targetProductId !== "number") {
      return NextResponse.json({ error: "targetProductId jest wymagane" }, { status: 400 });
    }

    const targetId = targetProductId;
    if (sourceId === targetId) {
      return NextResponse.json({ error: "Nie można scalić produktu sam ze sobą" }, { status: 400 });
    }

    const [source, target] = await Promise.all([
      prisma.recipeProduct.findUnique({ where: { id: sourceId } }),
      prisma.recipeProduct.findUnique({ where: { id: targetId } }),
    ]);

    if (!source) return NextResponse.json({ error: "Produkt źródłowy nie znaleziony" }, { status: 404 });
    if (!target) return NextResponse.json({ error: "Produkt docelowy nie znaleziony" }, { status: 404 });
    if (source.mergedIntoId) return NextResponse.json({ error: "Produkt źródłowy jest już scalony" }, { status: 400 });
    if (target.mergedIntoId) return NextResponse.json({ error: "Produkt docelowy jest już scalony" }, { status: 400 });

    await prisma.$transaction([
      prisma.recipeDishIngredient.updateMany({ where: { productId: sourceId }, data: { productId: targetId } }),
      prisma.recipeProduct.update({ where: { id: sourceId }, data: { mergedIntoId: targetId } }),
    ]);

    return NextResponse.json({ ok: true, mergedFrom: sourceId, mergedInto: targetId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd scalania produktów" }, { status: 500 });
  }
}
