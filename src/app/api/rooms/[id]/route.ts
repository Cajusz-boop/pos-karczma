export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

/** GET /api/rooms/[id] */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: { tables: { orderBy: { number: "asc" } } },
    });
    if (!room) return NextResponse.json({ error: "Sala nie istnieje" }, { status: 404 });
    return NextResponse.json(room);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania sali" }, { status: 500 });
  }
}

/** PATCH /api/rooms/[id] — aktualizacja (name, isActive, isSeasonal, sortOrder) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, isActive, isSeasonal, sortOrder } = body as {
      name?: string;
      isActive?: boolean;
      isSeasonal?: boolean;
      sortOrder?: number;
    };

    const data: { name?: string; isActive?: boolean; isSeasonal?: boolean; sortOrder?: number } = {};
    if (name !== undefined) data.name = name.trim();
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (isSeasonal !== undefined) data.isSeasonal = Boolean(isSeasonal);
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

    const room = await prisma.room.update({
      where: { id },
      data,
    });
    autoExportConfigSnapshot();
    return NextResponse.json(room);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji sali" }, { status: 500 });
  }
}
