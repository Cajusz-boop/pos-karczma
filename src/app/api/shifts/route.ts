export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createShiftSchema } from "@/lib/validation";


/** GET /api/shifts?status=OPEN&userId= â€” lista zmian (status OPEN zwraca otwarte z obrotem) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const where: { status?: "OPEN" | "CLOSED"; userId?: string } = {};
    if (status === "OPEN" || status === "CLOSED") where.status = status;
    if (userId) where.userId = userId;

    const shifts = await prisma.shift.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    const result = await Promise.all(
      shifts.map(async (s) => {
        let turnover = 0;
        if (s.status === "OPEN") {
          const payments = await prisma.payment.findMany({
            where: {
              order: { userId: s.userId, status: "CLOSED", closedAt: { gte: s.startedAt } },
            },
            select: { amount: true },
          });
          turnover = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        }
        return {
          id: s.id,
          userId: s.userId,
          userName: s.user.name,
          startedAt: s.startedAt.toISOString(),
          endedAt: s.endedAt?.toISOString() ?? null,
          cashStart: Number(s.cashStart),
          cashEnd: s.cashEnd != null ? Number(s.cashEnd) : null,
          status: s.status,
          turnover: Math.round(turnover * 100) / 100,
        };
      })
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d listy zmian" }, { status: 500 });
  }
}

/** POST /api/shifts â€” otwarcie zmiany (userId, cashStart) */
export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, createShiftSchema);
    if (valError) return valError;
    const { userId, cashStart } = data;

    const existing = await prisma.shift.findFirst({
      where: { userId, status: "OPEN" },
    });
    if (existing) {
      return NextResponse.json({ error: "UĹĽytkownik ma juĹĽ otwartÄ… zmianÄ™", shiftId: existing.id }, { status: 400 });
    }

    const shift = await prisma.shift.create({
      data: {
        userId,
        cashStart: cashStart != null ? Number(cashStart) : 0,
        status: "OPEN",
      },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json({
      id: shift.id,
      startedAt: shift.startedAt.toISOString(),
      cashStart: Number(shift.cashStart),
      userName: shift.user.name,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d otwarcia zmiany" }, { status: 500 });
  }
}
