export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/receptury/[id]/historia — historia zmian receptury */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);
    if (isNaN(recipeId)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

    const history = await prisma.recipeHistory.findMany({
      where: { recipeId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      history.map((h) => ({
        id: h.id,
        changedBy: h.changedBy,
        changeNote: h.changeNote,
        snapshot: h.snapshot,
        createdAt: h.createdAt,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania historii" }, { status: 500 });
  }
}
