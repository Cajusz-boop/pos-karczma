export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/jwt";

async function requireAuth() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 }) };
  return { user };
}

/** GET /api/events/[id] */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAuth();
  if (check.error) return check.error;

  const id = parseInt((await params).id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      package: {
        include: {
          items: {
            include: {
              recipeDish: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!event) return NextResponse.json({ error: "Impreza nie znaleziona" }, { status: 404 });
  return NextResponse.json(event);
}

/** PUT /api/events/[id] — uzupełnij guestCount, packageId, notes */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAuth();
  if (check.error) return check.error;

  const id = parseInt((await params).id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Impreza nie znaleziona" }, { status: 404 });
  if (event.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Ta impreza jest odwołana — nie można edytować" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { guestCount, packageId, notes } = body;

  if (guestCount !== undefined) {
    if (typeof guestCount !== "number" || guestCount <= 0) {
      return NextResponse.json(
        { error: "Liczba gości musi być większa od zera" },
        { status: 400 }
      );
    }
    if (guestCount > 1500) {
      return NextResponse.json(
        { error: "Liczba gości wydaje się za duża — sprawdź" },
        { status: 400 }
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (guestCount !== undefined) {
    updateData.guestCount = guestCount;
    updateData.guestCountSource = "MANUAL";
  }
  if (packageId !== undefined) updateData.packageId = packageId === null ? null : packageId;
  if (notes !== undefined) updateData.notes = notes;

  const newGuestCount = guestCount !== undefined ? guestCount : event.guestCount;
  const newPackageId = packageId !== undefined ? (packageId === null ? null : packageId) : event.packageId;
  if (newGuestCount != null && newPackageId != null) {
    (updateData as Record<string, unknown>).status = "CONFIRMED";
  }

  const result = await prisma.event.update({
    where: { id },
    data: updateData,
    include: {
      package: {
        include: {
          items: {
            include: {
              recipeDish: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(result);
}
