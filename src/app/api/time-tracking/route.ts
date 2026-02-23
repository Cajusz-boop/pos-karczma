import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
import { parseBody, timeTrackingSchema } from "@/lib/validation";

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "week"; // week | month | custom
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");

    let dateFrom: Date;
    let dateTo: Date;
    const now = new Date();

    if (range === "week") {
      dateFrom = startOfWeek(now, { weekStartsOn: 1 });
      dateTo = endOfWeek(now, { weekStartsOn: 1 });
    } else if (range === "month") {
      dateFrom = startOfMonth(now);
      dateTo = endOfMonth(now);
    } else if (range === "custom" && dateFromParam && dateToParam) {
      dateFrom = startOfDay(parseISO(dateFromParam));
      dateTo = endOfDay(parseISO(dateToParam));
    } else {
      dateFrom = startOfWeek(now, { weekStartsOn: 1 });
      dateTo = endOfWeek(now, { weekStartsOn: 1 });
    }

    const entries = await prisma.timeEntry.findMany({
      where: {
        clockIn: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ clockIn: "desc" }],
    });

    // Group by user and compute total hours
    const byUser = new Map<
      string,
      { userName: string; entries: typeof entries; totalMinutes: number }
    >();

    for (const e of entries) {
      const existing = byUser.get(e.userId);
      const clockOut = e.clockOut ?? now;
      const minutes =
        Math.max(0, (clockOut.getTime() - e.clockIn.getTime()) / 60000) -
        (e.breakMin ?? 0);

      if (existing) {
        existing.entries.push(e);
        existing.totalMinutes += minutes;
      } else {
        byUser.set(e.userId, {
          userName: e.user.name,
          entries: [e],
          totalMinutes: minutes,
        });
      }
    }

    const result = Array.from(byUser.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      entries: data.entries.map((ent) => ({
        id: ent.id,
        clockIn: ent.clockIn.toISOString(),
        clockOut: ent.clockOut?.toISOString() ?? null,
        breakMin: ent.breakMin,
        note: ent.note,
      })),
      totalHours: Math.round((data.totalMinutes / 60) * 100) / 100,
    }));

    return NextResponse.json({
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      employees: result,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "BĹ‚Ä…d pobierania rejestru czasu" },
      { status: 500 }
    );
  }
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, timeTrackingSchema);
    if (valError) return valError;
    const { userId, action } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "UĹĽytkownik nie istnieje lub jest nieaktywny" },
        { status: 404 }
      );
    }

    if (action === "clock-in") {
      const openEntry = await prisma.timeEntry.findFirst({
        where: { userId, clockOut: null },
      });
      if (openEntry) {
        return NextResponse.json(
          { error: "Masz juĹĽ otwarty wpis. Najpierw wyjdĹş z pracy." },
          { status: 400 }
        );
      }
      const entry = await prisma.timeEntry.create({
        data: { userId, clockIn: new Date() },
      });
      return NextResponse.json({
        ok: true,
        entry: {
          id: entry.id,
          clockIn: entry.clockIn.toISOString(),
          clockOut: null,
        },
      });
    }

    if (action === "clock-out") {
      const openEntry = await prisma.timeEntry.findFirst({
        where: { userId, clockOut: null },
      });
      if (!openEntry) {
        return NextResponse.json(
          { error: "Brak otwartego wpisu. Najpierw rozpocznij pracÄ™." },
          { status: 400 }
        );
      }
      await prisma.timeEntry.update({
        where: { id: openEntry.id },
        data: { clockOut: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Nieznana akcja. UĹĽyj clock-in lub clock-out." },
      { status: 400 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "BĹ‚Ä…d rejestracji czasu" },
      { status: 500 }
    );
  }
}
