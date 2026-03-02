export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";


const upsertSchema = z.object({
  userId: z.string().min(1),
  date: z.string().min(1),
  available: z.boolean(),
  timeFrom: z.string().optional(),
  timeTo: z.string().optional(),
  note: z.string().optional(),
});

/**
 * GET /api/schedule/availability "” get staff availability for a date range
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFrom = from ? new Date(from) : new Date();
    const dateTo = to ? new Date(to) : new Date(dateFrom.getTime() + 7 * 86400000);

    const availability = await prisma.staffAvailability.findMany({
      where: { date: { gte: dateFrom, lte: dateTo } },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ date: "asc" }, { user: { name: "asc" } }],
    });

    return NextResponse.json({
      availability: availability.map((a) => ({
        id: a.id,
        userId: a.userId,
        userName: a.user.name,
        date: a.date.toISOString().slice(0, 10),
        available: a.available,
        timeFrom: a.timeFrom,
        timeTo: a.timeTo,
        note: a.note,
      })),
    });
  } catch (e) {
    console.error("[Availability GET]", e);
    return NextResponse.json({ error: "Błąd pobierania dostępności" }, { status: 500 });
  }
}

/**
 * POST /api/schedule/availability "” set availability for a user/date
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { userId, date, available, timeFrom, timeTo, note } = parsed.data;

    const entry = await prisma.staffAvailability.upsert({
      where: { userId_date: { userId, date: new Date(date) } },
      create: {
        userId,
        date: new Date(date),
        available,
        timeFrom: timeFrom ?? null,
        timeTo: timeTo ?? null,
        note: note ?? null,
      },
      update: {
        available,
        timeFrom: timeFrom ?? null,
        timeTo: timeTo ?? null,
        note: note ?? null,
      },
    });

    return NextResponse.json({ entry });
  } catch (e) {
    console.error("[Availability POST]", e);
    return NextResponse.json({ error: "Błąd zapisu dostępności" }, { status: 500 });
  }
}
