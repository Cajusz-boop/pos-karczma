import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createReservationSchema } from "@/lib/validation";

/** POST /api/reservations/online — rezerwacja ze strony WWW: status PENDING, source ONLINE. Blokada nieaktywnych sal. */
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
    if (!room.isActive) {
      return NextResponse.json({ error: "Ta sala jest obecnie niedostępna do rezerwacji (np. Wiata poza sezonem)." }, { status: 400 });
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
        status: "PENDING",
        source: "ONLINE",
      },
    });

    return NextResponse.json({
      id: reservation.id,
      status: reservation.status,
      message: "Rezerwacja przyjęta. Oczekuje na potwierdzenie.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia rezerwacji" }, { status: 500 });
  }
}
