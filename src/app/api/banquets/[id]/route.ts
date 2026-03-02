export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await prisma.banquetEvent.findUnique({
      where: { id },
      include: {
        reservation: true,
        menu: { select: { id: true, name: true, pricePerPerson: true, itemsJson: true } },
        rooms: { select: { id: true, name: true } },
        orders: { select: { id: true, orderNumber: true, status: true, tableId: true } },
        menuModifications: true,
      },
    });
    if (!event) return NextResponse.json({ error: "Impreza nie istnieje" }, { status: 404 });
    return NextResponse.json({
      id: event.id,
      reservationId: event.reservationId,
      reservation: event.reservation,
      eventType: event.eventType,
      guestCount: event.guestCount,
      menuId: event.menuId,
      menu: event.menu,
      pricePerPerson: Number(event.pricePerPerson),
      extrasJson: event.extrasJson,
      depositRequired: Number(event.depositRequired),
      depositPaid: Number(event.depositPaid),
      depositMethod: event.depositMethod,
      contactPerson: event.contactPerson,
      contactPhone: event.contactPhone,
      contactEmail: event.contactEmail,
      notes: event.notes,
      status: event.status,
      createdAt: event.createdAt,
      rooms: event.rooms,
      orders: event.orders,
      menuModifications: event.menuModifications,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania imprezy" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      guestCount,
      menuId,
      pricePerPerson,
      depositRequired,
      depositPaid,
      contactPerson,
      contactPhone,
      contactEmail,
      notes,
    } = body as {
      status?: string;
      guestCount?: number;
      menuId?: string | null;
      pricePerPerson?: number;
      depositRequired?: number;
      depositPaid?: number;
      contactPerson?: string;
      contactPhone?: string;
      contactEmail?: string | null;
      notes?: string | null;
    };
    const event = await prisma.banquetEvent.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Impreza nie istnieje" }, { status: 404 });
    const validStatuses = ["INQUIRY", "CONFIRMED", "DEPOSIT_PAID", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    const data: Record<string, unknown> = {};
    if (status != null && validStatuses.includes(status)) data.status = status;
    if (guestCount != null) data.guestCount = Number(guestCount);
    if (menuId !== undefined) data.menuId = menuId?.trim() || null;
    if (pricePerPerson != null) data.pricePerPerson = Number(pricePerPerson);
    if (depositRequired != null) data.depositRequired = Number(depositRequired);
    if (depositPaid != null) data.depositPaid = Number(depositPaid);
    if (contactPerson != null) data.contactPerson = contactPerson.trim();
    if (contactPhone != null) data.contactPhone = contactPhone.trim();
    if (contactEmail !== undefined) data.contactEmail = contactEmail?.trim() ?? null;
    if (notes !== undefined) data.notes = notes?.trim() ?? null;
    const updated = await prisma.banquetEvent.update({
      where: { id },
      data: data as Parameters<typeof prisma.banquetEvent.update>[0]["data"],
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji imprezy" }, { status: 500 });
  }
}
