export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";


const createSchema = z.object({
  userId: z.string().min(1),
  date: z.string().min(1),
  shiftStart: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  shiftEnd: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  role: z.string().optional(),
  note: z.string().optional(),
});

/**
 * GET /api/schedule â€” get work schedule for a date range
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const userId = searchParams.get("userId");

    const dateFrom = from ? new Date(from) : new Date();
    const dateTo = to ? new Date(to) : new Date(dateFrom.getTime() + 7 * 86400000);

    const where: Record<string, unknown> = {
      date: { gte: dateFrom, lte: dateTo },
    };
    if (userId) where.userId = userId;

    const schedules = await prisma.workSchedule.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ date: "asc" }, { shiftStart: "asc" }],
    });

    // Also get all active users for the schedule grid
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      schedules: schedules.map((s) => ({
        id: s.id,
        userId: s.userId,
        userName: s.user.name,
        date: s.date.toISOString().slice(0, 10),
        shiftStart: s.shiftStart,
        shiftEnd: s.shiftEnd,
        role: s.role,
        note: s.note,
        isConfirmed: s.isConfirmed,
      })),
      users,
    });
  } catch (e) {
    console.error("[Schedule GET]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d pobierania grafiku" }, { status: 500 });
  }
}

/**
 * POST /api/schedule â€” create or update a schedule entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { userId, date, shiftStart, shiftEnd, role, note } = parsed.data;

    const schedule = await prisma.workSchedule.upsert({
      where: {
        userId_date: { userId, date: new Date(date) },
      },
      create: {
        userId,
        date: new Date(date),
        shiftStart,
        shiftEnd,
        role: role ?? null,
        note: note ?? null,
      },
      update: {
        shiftStart,
        shiftEnd,
        role: role ?? null,
        note: note ?? null,
      },
    });

    return NextResponse.json({ schedule });
  } catch (e) {
    console.error("[Schedule POST]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d zapisu grafiku" }, { status: 500 });
  }
}

/**
 * DELETE /api/schedule â€” remove a schedule entry
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Wymagane id" }, { status: 400 });
    }

    await prisma.workSchedule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Schedule DELETE]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d usuwania" }, { status: 500 });
  }
}
