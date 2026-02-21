import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createBanquetSchema } from "@/lib/validation";

/** GET /api/banquets — lista imprez bankietowych */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const events = await prisma.banquetEvent.findMany({
      where: status ? { status: status as "INQUIRY" | "CONFIRMED" | "DEPOSIT_PAID" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" } : { status: { not: "CANCELLED" } },
      include: {
        reservation: { select: { id: true, date: true, timeFrom: true, timeTo: true, guestName: true, guestPhone: true, guestCount: true, roomId: true } },
        menu: { select: { id: true, name: true, pricePerPerson: true, itemsJson: true } },
        rooms: { select: { id: true, name: true } },
        orders: { where: { status: { notIn: ["CLOSED", "CANCELLED"] } }, select: { id: true, orderNumber: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    });
    return NextResponse.json(
      events.map((e) => ({
        id: e.id,
        reservationId: e.reservationId,
        eventType: e.eventType,
        guestCount: e.guestCount,
        menuId: e.menuId,
        menuName: e.menu?.name,
        pricePerPerson: Number(e.pricePerPerson),
        extrasJson: e.extrasJson,
        depositRequired: Number(e.depositRequired),
        depositPaid: Number(e.depositPaid),
        depositMethod: e.depositMethod,
        contactPerson: e.contactPerson,
        contactPhone: e.contactPhone,
        contactEmail: e.contactEmail,
        notes: e.notes,
        status: e.status,
        createdAt: e.createdAt,
        reservation: e.reservation,
        rooms: e.rooms,
        activeOrderId: e.orders[0]?.id ?? null,
        activeOrderNumber: e.orders[0]?.orderNumber ?? null,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd listy bankietów" }, { status: 500 });
  }
}

/** POST /api/banquets — tworzenie imprezy (Reservation + BanquetEvent) */
export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, createBanquetSchema);
    if (valError) return valError;
    const {
      roomIds,
      eventType,
      guestCount,
      contactPerson,
      contactPhone,
      date,
      timeFrom,
    } = data;
    const d = data as Record<string, unknown>;
    const menuId = d.menuId as string | null | undefined;
    const pricePerPerson = d.pricePerPerson as number | undefined;
    const depositRequired = d.depositRequired as number | undefined;
    const extrasJson = d.extrasJson as object | undefined;
    const contactEmail = d.contactEmail as string | null | undefined;
    const notes = d.notes as string | null | undefined;
    const timeTo = d.timeTo as string | null | undefined;
    const guestName = d.guestName as string | undefined;
    const primaryRoomId = roomIds[0];
    const reservation = await prisma.reservation.create({
      data: {
        roomId: primaryRoomId,
        date: new Date(date),
        timeFrom: new Date(`${date}T${timeFrom}`),
        timeTo: timeTo ? new Date(`${date}T${timeTo}`) : null,
        guestName: guestName?.trim() || contactPerson.trim(),
        guestCount: Number(guestCount) || 1,
        type: "BANQUET",
        status: "CONFIRMED",
        notes: notes?.trim() ?? null,
      },
    });
    const banquetEvent = await prisma.banquetEvent.create({
      data: {
        reservationId: reservation.id,
        eventType: eventType as "WEDDING" | "EIGHTEENTH" | "CORPORATE" | "COMMUNION" | "CHRISTENING" | "FUNERAL" | "OTHER",
        guestCount: Number(guestCount),
        menuId: menuId?.trim() || null,
        pricePerPerson: Number(pricePerPerson) || 0,
        depositRequired: Number(depositRequired) || 0,
        extrasJson: extrasJson ?? null,
        contactPerson: contactPerson.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail?.trim() ?? null,
        notes: notes?.trim() ?? null,
        status: "CONFIRMED",
        rooms: { connect: roomIds.map((id) => ({ id })) },
      },
      include: { reservation: true, menu: true, rooms: true },
    });
    return NextResponse.json({
      id: banquetEvent.id,
      reservationId: banquetEvent.reservationId,
      status: banquetEvent.status,
      guestCount: banquetEvent.guestCount,
      rooms: banquetEvent.rooms.map((r) => r.name),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia imprezy" }, { status: 500 });
  }
}
