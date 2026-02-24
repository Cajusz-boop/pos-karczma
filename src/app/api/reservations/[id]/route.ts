export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/reservations/[id] */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const r = await prisma.reservation.findUnique({
      where: { id },
      include: {
        room: { select: { id: true, name: true } },
        table: { select: { id: true, number: true, seats: true } },
      },
    });
    if (!r) return NextResponse.json({ error: "Rezerwacja nie istnieje" }, { status: 404 });
    return NextResponse.json({
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
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania rezerwacji" }, { status: 500 });
  }
}

/** PATCH /api/reservations/[id] — aktualizacja (status, stolik, dane). Przy CANCELLED/NO_SHOW zwalniamy stolik. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      tableId,
      date,
      timeFrom,
      timeTo,
      guestName,
      guestPhone,
      guestEmail,
      guestCount,
      notes,
    } = body as {
      status?: string;
      tableId?: string | null;
      date?: string;
      timeFrom?: string;
      timeTo?: string | null;
      guestName?: string;
      guestPhone?: string | null;
      guestEmail?: string | null;
      guestCount?: number;
      notes?: string | null;
    };

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });
    if (!reservation) return NextResponse.json({ error: "Rezerwacja nie istnieje" }, { status: 404 });

    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "NO_SHOW", "COMPLETED"];
    const data: {
      status?: string;
      tableId?: string | null;
      date?: Date;
      timeFrom?: Date;
      timeTo?: Date | null;
      guestName?: string;
      guestPhone?: string | null;
      guestEmail?: string | null;
      guestCount?: number;
      notes?: string | null;
    } = {};

    if (status != null && validStatuses.includes(status)) data.status = status;
    if (tableId !== undefined) data.tableId = tableId?.trim() || null;
    if (date != null) data.date = new Date(date);
    if (timeFrom != null) data.timeFrom = new Date(`${reservation.date.toISOString().slice(0, 10)}T${timeFrom}`);
    if (timeTo !== undefined) data.timeTo = timeTo ? new Date(`${reservation.date.toISOString().slice(0, 10)}T${timeTo}`) : null;
    if (guestName != null) data.guestName = guestName.trim();
    if (guestPhone !== undefined) data.guestPhone = guestPhone?.trim() ?? null;
    if (guestEmail !== undefined) data.guestEmail = guestEmail?.trim() ?? null;
    if (guestCount != null) data.guestCount = Math.max(1, Number(guestCount));
    if (notes !== undefined) data.notes = notes?.trim() ?? null;

    const oldTableId = reservation.tableId;
    const newTableId = data.tableId !== undefined ? data.tableId : reservation.tableId;

    await prisma.$transaction(async (tx) => {
      if (status === "CANCELLED" || status === "NO_SHOW" || status === "COMPLETED") {
        if (reservation.tableId) {
          await tx.table.update({
            where: { id: reservation.tableId },
            data: { status: "FREE" },
          });
        }
      } else if (newTableId) {
        if (newTableId !== oldTableId) {
          if (oldTableId) {
            await tx.table.update({ where: { id: oldTableId }, data: { status: "FREE" } });
          }
          await tx.table.update({ where: { id: newTableId }, data: { status: "RESERVED" } });
        } else if (status === "CONFIRMED") {
          await tx.table.update({ where: { id: newTableId }, data: { status: "RESERVED" } });
        }
      }

      await tx.reservation.update({
        where: { id },
        data: data as Parameters<typeof tx.reservation.update>[0]["data"],
      });
    });

    const updated = await prisma.reservation.findUnique({
      where: { id },
      include: { room: { select: { name: true } }, table: { select: { number: true } } },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji rezerwacji" }, { status: 500 });
  }
}
