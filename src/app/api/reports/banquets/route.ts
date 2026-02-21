import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

/** GET /api/reports/banquets?dateFrom=&dateTo= — raport bankietowy (lista imprez, typ, obrót, zaliczki, rentowność) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: "Wymagane: dateFrom, dateTo (YYYY-MM-DD)" }, { status: 400 });
    }
    const from = startOfDay(new Date(dateFrom));
    const to = endOfDay(new Date(dateTo));

    const events = await prisma.banquetEvent.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        reservation: { select: { date: true, guestName: true } },
        menu: { select: { name: true, pricePerPerson: true } },
        orders: { where: { status: "CLOSED" }, include: { payments: true } },
      },
    });

    const list = events.map((e) => {
      const turnover = e.orders.reduce((s, o) => s + o.payments.reduce((s2, p) => s2 + Number(p.amount), 0), 0);
      return {
        id: e.id,
        eventType: e.eventType,
        date: e.reservation?.date ? new Date(e.reservation.date).toISOString().slice(0, 10) : null,
        guestName: e.reservation?.guestName ?? "",
        guestCount: e.guestCount,
        menuName: e.menu?.name ?? "",
        pricePerPerson: Number(e.pricePerPerson),
        depositRequired: Number(e.depositRequired),
        depositPaid: Number(e.depositPaid),
        status: e.status,
        turnover: Math.round(turnover * 100) / 100,
        createdAt: e.createdAt.toISOString().slice(0, 10),
      };
    });

    const byType: Record<string, { count: number; totalTurnover: number; avgTurnover: number }> = {};
    for (const e of list) {
      const t = e.eventType;
      if (!byType[t]) byType[t] = { count: 0, totalTurnover: 0, avgTurnover: 0 };
      byType[t].count += 1;
      byType[t].totalTurnover += e.turnover;
    }
    for (const t of Object.keys(byType)) {
      if (byType[t].count > 0) byType[t].avgTurnover = Math.round((byType[t].totalTurnover / byType[t].count) * 100) / 100;
    }

    return NextResponse.json({
      dateFrom: dateFrom.slice(0, 10),
      dateTo: dateTo.slice(0, 10),
      events: list,
      byType,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd raportu bankietowego" }, { status: 500 });
  }
}
