export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/jwt";

/** GET /api/events/draft-count — liczba imprez DRAFT w bieżącym i następnym tygodniu */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  const nextWeekEnd = new Date(weekStart);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 14);

  const count = await prisma.event.count({
    where: {
      status: "DRAFT",
      startDate: { gte: weekStart },
      endDate: { lte: nextWeekEnd },
    },
  });

  return NextResponse.json({ count });
}
