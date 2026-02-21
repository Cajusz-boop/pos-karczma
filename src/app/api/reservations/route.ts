import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processNoShows } from "@/lib/reservations/no-show";
import { parseBody, createReservationSchema } from "@/lib/validation";

/** GET /api/reservations — lista rezerwacji (filtr: dateFrom, dateTo, roomId, status) */
export async function GET(request: NextRequest) {
  try {
    await processNoShows(prisma);

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const roomId = searchParams.get("roomId");
    const status = searchParams.get("status");

    const where: { date?: { gte?: Date; lte?: Date }; roomId?: string; status?: string } = {};
    if (dateFrom) where.date = { ...where.date, gte: new Date(dateFrom) };
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      where.date = { ...where.date, lte: to };
    }
    if (roomId) where.roomId = roomId;
    if (status) where.status = status as "PENDING" | "CONFIRMED" | "CANCELLED" | "NO_SHOW" | "COMPLETED";

    const reservations = await prisma.reservation.findMany({
      where: { ...where, type: "TABLE" },
      include: {
        room: { select: { id: true, name: true } },
        table: { select: { id: true, number: true, seats: true } },
      },
      orderBy: [{ date: "asc" }, { timeFrom: "asc" }],
      take: 200,
    });

    return NextResponse.json(
      reservations.map((r) => ({
        id: r.id,
        roomId: r.roomId,
        roomName: r.room.name,
        tableId: r.tableId,
        tableNumber: r.table?.number,
        seats: r.table?.seats,
        date: r.date.toISOString().slice(0, 10),
        timeFrom: r.timeFrom.toISOString().slice(11, 16),
        timeTo: r.timeTo?.toISOString().slice(11, 16) ?? null,
        guestName: r.guestName,
        guestPhone: r.guestPhone,
        guestEmail: r.guestEmail,
        guestCount: r.guestCount,
        type: r.type,
        notes: r.notes,
        status: r.status,
        source: r.source,
        createdAt: r.createdAt,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania rezerwacji" }, { status: 500 });
  }
}

/** POST /api/reservations — rezerwacja (telefon): status CONFIRMED, source PHONE */
export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, createReservationSchema);
    if (valError) return valError;
    const {
      roomId,
      tableId,
      date,
      timeFrom,
      timeTo,
      guestName,
      guestPhone,
      guestEmail,
      guestCount,
      notes,
    } = data;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: "Sala nie istnieje" }, { status: 404 });
    if (!room.isActive) return NextResponse.json({ error: "Sala jest nieaktywna (np. Wiata poza sezonem)" }, { status: 400 });

    if (tableId) {
      const table = await prisma.table.findFirst({ where: { id: tableId, roomId } });
      if (!table) return NextResponse.json({ error: "Stolik nie należy do wybranej sali" }, { status: 400 });
    }

    const dateObj = new Date(date);
    const timeFromObj = new Date(`${date}T${timeFrom}`);
    const timeToObj = timeTo ? new Date(`${date}T${timeTo}`) : null;

    const reservation = await prisma.reservation.create({
      data: {
        roomId,
        tableId: tableId?.trim() || null,
        date: dateObj,
        timeFrom: timeFromObj,
        timeTo: timeToObj,
        guestName: guestName.trim(),
        guestPhone: guestPhone?.trim() ?? null,
        guestEmail: guestEmail?.trim() ?? null,
        guestCount: Math.max(1, Number(guestCount) || 1),
        type: "TABLE",
        notes: notes?.trim() ?? null,
        status: "CONFIRMED",
        source: "PHONE",
      },
    });

    if (tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: "RESERVED" },
      });
    }

    return NextResponse.json({
      id: reservation.id,
      status: reservation.status,
      date: reservation.date.toISOString().slice(0, 10),
      timeFrom: reservation.timeFrom.toISOString().slice(11, 16),
      guestName: reservation.guestName,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia rezerwacji" }, { status: 500 });
  }
}
