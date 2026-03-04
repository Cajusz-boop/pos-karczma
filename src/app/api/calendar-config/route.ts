export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
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

/** GET /api/calendar-config — lista skonfigurowanych kalendarzy */
export async function GET() {
  const check = await requireAdmin();
  if (check.error) return check.error;

  const configs = await prisma.calendarConfig.findMany({
    include: {
      defaultPackage: { select: { id: true, name: true } },
    },
    orderBy: { calendarName: "asc" },
  });

  return NextResponse.json(configs);
}
