export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/jwt";

async function requireAuth() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 }) };
  return { user };
}

/** POST /api/events/[id]/cancel — oznacz jako CANCELLED */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAuth();
  if (check.error) return check.error;

  const id = parseInt((await params).id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Impreza nie znaleziona" }, { status: 404 });

  await prisma.event.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
