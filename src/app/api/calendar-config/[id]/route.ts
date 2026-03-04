export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/jwt";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 }) };
  if (user.roleName !== "ADMIN" && !user.isOwner) {
    return { error: NextResponse.json({ error: "Dostęp tylko dla administratora" }, { status: 403 }) };
  }
  return { user };
}

/** PUT /api/calendar-config/[id] — zmień domyślny pakiet lub roomName */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  const id = parseInt((await params).id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

  const body = await request.json();
  const { defaultPackageId, roomName } = body;

  const updateData: Record<string, unknown> = {};
  if (defaultPackageId !== undefined) {
    updateData.defaultPackageId = defaultPackageId === null ? null : defaultPackageId;
  }
  if (roomName !== undefined) updateData.roomName = roomName;

  const config = await prisma.calendarConfig.update({
    where: { id },
    data: updateData,
    include: {
      defaultPackage: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(config);
}
