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

/** GET /api/tagi — lista tagów z liczbą receptur */
export async function GET() {
  const check = await requireRecepturyAccess();
  if (check.error) return check.error;
  try {
    const tags = await prisma.recipeTag.findMany({
      include: { _count: { select: { recipeDishes: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(
      tags.map((t) => ({ id: t.id, name: t.name, color: t.color, recipeCount: t._count.recipeDishes }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania tagów" }, { status: 500 });
  }
}

/** POST /api/tagi — utwórz tag */
export async function POST(request: NextRequest) {
  const check = await requireRecepturyAccess();
  if (check.error) return check.error;

  try {
    const body = await request.json();
    const { name, color = "#6B7280" } = body as { name: string; color?: string };
    if (!name?.trim()) return NextResponse.json({ error: "Nazwa jest wymagana" }, { status: 400 });

    const tag = await prisma.recipeTag.create({
      data: { name: name.trim(), color: String(color || "#6B7280").slice(0, 7) },
    });
    return NextResponse.json({ id: tag.id, name: tag.name, color: tag.color });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia tagu" }, { status: 500 });
  }
}
