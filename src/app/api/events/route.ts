export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/jwt";
import type { EventStatus, EventType } from "@prisma/client";

async function requireAuth() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 }) };
  return { user };
}

/** GET /api/events?weekStart=&weekEnd=&status=&type= */
export async function GET(request: NextRequest) {
  const check = await requireAuth();
  if (check.error) return check.error;

  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart");
    const weekEnd = searchParams.get("weekEnd");
    const status = searchParams.get("status") as EventStatus | null;
    const type = searchParams.get("type") as EventType | null;

    const where: Record<string, unknown> = {};

    if (weekStart && weekEnd) {
      const start = new Date(weekStart);
      const end = new Date(weekEnd);
      where.startDate = { gte: start };
      where.endDate = { lte: end };
    }

    if (status && ["DRAFT", "CONFIRMED", "CANCELLED"].includes(status)) {
      where.status = status;
    }

    if (type) {
      const validTypes: EventType[] = [
        "WESELE",
        "POPRAWINY",
        "CHRZCINY",
        "KOMUNIA",
        "URODZINY_ROCZNICA",
        "STYPA",
        "IMPREZA_FIRMOWA",
        "CATERING",
        "SPOTKANIE",
        "SYLWESTER",
        "INNE",
      ];
      if (validTypes.includes(type)) where.eventType = type;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        package: { select: { id: true, name: true } },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(events);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania imprez" }, { status: 500 });
  }
}
