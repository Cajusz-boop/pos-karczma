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

/** PUT /api/produkty/[id] — zmień nazwę lub jednostkę */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

    const body = await request.json();
    const { name, defaultUnit } = body as { name?: string; defaultUnit?: string };

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (defaultUnit !== undefined) data.defaultUnit = String(defaultUnit).slice(0, 20);

    const product = await prisma.recipeProduct.update({
      where: { id: productId },
      data,
    });
    return NextResponse.json({ id: product.id, name: product.name, defaultUnit: product.defaultUnit });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji" }, { status: 500 });
  }
}

/** DELETE /api/produkty/[id] — tylko gdy 0 receptur */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

    const count = await prisma.recipeDishIngredient.count({ where: { productId } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Produkt jest używany w ${count} składnikach. Usuń go z receptur najpierw.` },
        { status: 400 }
      );
    }

    await prisma.recipeProduct.delete({ where: { id: productId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd usuwania" }, { status: 500 });
  }
}
