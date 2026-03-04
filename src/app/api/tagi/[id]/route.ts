export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/jwt";

async function requireRecepturyAccess() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 }) };
  if (user.roleName !== "ADMIN" && user.roleName !== "SZEF_KUCHNI" && !user.isOwner) {
    return { error: NextResponse.json({ error: "Brak dostępu do receptur" }, { status: 403 }) };
  }
  return { user };
}

/** PUT /api/tagi/[id] */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireRecepturyAccess();
  if (check.error) return check.error;

  try {
    const { id } = await params;
    const tagId = parseInt(id, 10);
    if (isNaN(tagId)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

    const body = await request.json();
    const { name, color } = body as { name?: string; color?: string };

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (color !== undefined) data.color = String(color).slice(0, 7);

    const tag = await prisma.recipeTag.update({ where: { id: tagId }, data });
    return NextResponse.json({ id: tag.id, name: tag.name, color: tag.color });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji" }, { status: 500 });
  }
}

/** DELETE /api/tagi/[id] — odpinij od receptur */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireRecepturyAccess();
  if (check.error) return check.error;

  try {
    const { id } = await params;
    const tagId = parseInt(id, 10);
    if (isNaN(tagId)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

    await prisma.recipeDishTag.deleteMany({ where: { tagId } });
    await prisma.recipeTag.delete({ where: { id: tagId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd usuwania" }, { status: 500 });
  }
}
