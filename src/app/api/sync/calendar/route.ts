export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { syncCalendars } from "@/lib/calendarSync";
import { prisma } from "@/lib/prisma";

/** POST /api/sync/calendar — uruchom synchronizację z Google Calendar */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = process.env.CALENDAR_SYNC_SECRET;
  if (!token || authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  try {
    const result = await syncCalendars();
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd synchronizacji" },
      { status: 500 }
    );
  }
}

/** GET /api/sync/calendar/status — status ostatniej synchronizacji + liczba DRAFT */
export async function GET() {
  try {
    const lastLog = await prisma.calendarSyncLog.findFirst({
      orderBy: { syncedAt: "desc" },
    });

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const nextWeekEnd = new Date(weekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 14);

    const draftCount = await prisma.event.count({
      where: {
        status: "DRAFT",
        startDate: { gte: weekStart },
        endDate: { lte: nextWeekEnd },
      },
    });

    return NextResponse.json({
      lastSync: lastLog
        ? {
            syncedAt: lastLog.syncedAt,
            eventsAdded: lastLog.eventsAdded,
            eventsUpdated: lastLog.eventsUpdated,
            eventsCancelled: lastLog.eventsCancelled,
            error: lastLog.error,
          }
        : null,
      draftCount,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania statusu" }, { status: 500 });
  }
}
